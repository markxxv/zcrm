<?php

namespace App\Http\Controllers;

use App\Models\ChunkUpload;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ChunkUploadController extends Controller
{
    public const CHUNK_SIZE = 262144; // 256 KiB, including multipart overhead well below a 2 MB request limit.
    public const MAX_FILE_SIZE = 1073741824; // 1 GiB per file.
    private const ASSEMBLE_BATCH = 64; // Assemble at most 16 MiB per HTTP request.

    private function authorizeTarget(Request $request, string $type, int $id): Project|Task
    {
        if ($type === 'project') {
            $target = Project::findOrFail($id);
            $this->authorize('view', $target);

            return $target;
        }

        abort_unless($type === 'task', 422);
        $target = Task::findOrFail($id);
        $this->authorize('update', $target);

        return $target;
    }

    private function authorized(Request $request, ChunkUpload $upload): Project|Task
    {
        abort_unless($upload->user_id === $request->user()->id, 403);
        abort_if($upload->expires_at->isPast(), 410, 'Upload session expired. Select the file again.');

        return $this->authorizeTarget($request, $upload->target_type, $upload->target_id);
    }

    private function state(ChunkUpload $upload): array
    {
        return [
            'id' => $upload->id,
            'chunk_size' => $upload->chunk_size,
            'total_chunks' => $upload->total_chunks,
            'received' => $upload->parts()->orderBy('chunk_index')->pluck('chunk_index')->all(),
            'assembled_chunks' => $upload->assembled_chunks,
            'status' => $upload->status,
            'result_id' => $upload->result_id,
        ];
    }

    public function start(Request $request)
    {
        $data = $request->validate([
            'target_type' => ['required', Rule::in(['project', 'task'])],
            'target_id' => ['required', 'integer', 'min:1'],
            'name' => ['required', 'string', 'max:255'],
            'size' => ['required', 'integer', 'min:1', 'max:'.self::MAX_FILE_SIZE],
            'mime_type' => ['nullable', 'string', 'max:160'],
            'client_key' => ['required', 'regex:/^[a-f0-9]{64}$/'],
        ]);

        $this->authorizeTarget($request, $data['target_type'], (int) $data['target_id']);
        $name = basename(str_replace('\\', '/', $data['name']));

        $query = ChunkUpload::query()
            ->where('user_id', $request->user()->id)
            ->where('target_type', $data['target_type'])
            ->where('target_id', $data['target_id'])
            ->where('client_key', $data['client_key'])
            ->where('name', $name)
            ->where('size', $data['size'])
            ->where('expires_at', '>', now())
            ->whereIn('status', ['uploading', 'assembling'])
            ->latest();

        if ($existing = $query->first()) {
            return response()->json($this->state($existing));
        }

        abort_if(
            ChunkUpload::query()->where('user_id', $request->user()->id)
                ->where('expires_at', '>', now())->whereIn('status', ['uploading', 'assembling'])->count() >= 20,
            429,
            'Too many pending uploads. Finish or cancel previous uploads.'
        );

        $upload = ChunkUpload::create([
            'user_id' => $request->user()->id,
            'target_type' => $data['target_type'],
            'target_id' => $data['target_id'],
            'client_key' => $data['client_key'],
            'name' => $name,
            'mime_type' => $data['mime_type'] ?? null,
            'size' => $data['size'],
            'chunk_size' => self::CHUNK_SIZE,
            'total_chunks' => (int) ceil($data['size'] / self::CHUNK_SIZE),
            'expires_at' => now()->addHours(48),
        ]);

        return response()->json($this->state($upload), 201);
    }

    public function status(Request $request, ChunkUpload $upload)
    {
        $this->authorized($request, $upload);

        return response()->json($this->state($upload));
    }

    public function chunk(Request $request, ChunkUpload $upload, int $index)
    {
        $this->authorized($request, $upload);
        abort_unless($index >= 0 && $index < $upload->total_chunks, 404);

        $data = $request->validate([
            'chunk' => ['required', 'file', 'max:320'], // request contains just one 256 KiB chunk.
            'sha256' => ['required', 'regex:/^[a-f0-9]{64}$/'],
        ]);
        $part = $data['chunk'];
        $expectedSize = (int) min($upload->chunk_size, $upload->size - $index * $upload->chunk_size);

        if ($part->getSize() !== $expectedSize || !hash_equals($data['sha256'], hash_file('sha256', $part->getRealPath()))) {
            throw ValidationException::withMessages(['chunk' => 'Chunk size or checksum mismatch. Retry this part.']);
        }

        return DB::transaction(function () use ($upload, $index, $part, $data) {
            $upload = ChunkUpload::query()->lockForUpdate()->findOrFail($upload->id);
            abort_unless($upload->status === 'uploading', 409, 'Upload has already started assembly.');

            $existing = $upload->parts()->where('chunk_index', $index)->first();
            if ($existing) {
                abort_unless(hash_equals($existing->sha256, $data['sha256']), 409,
                    'This chunk differs from the one already received. Cancel and restart this upload.');
                if (Storage::disk('local')->exists($upload->partPath($index))) {
                    return response()->json(['chunk_index' => $index, 'received' => true]);
                }
                // The database record exists, but the temporary chunk was lost.
                $upload->parts()->where('chunk_index', $index)->delete();
            }

            $stored = $part->storeAs($upload->folder(), sprintf('%06d', $index).'.part', 'local');
            if ($stored === false) {
                throw ValidationException::withMessages(['chunk' => 'Could not write the file chunk. Check available disk space.']);
            }

            $upload->parts()->create(['chunk_index' => $index] + [
                'size' => $part->getSize(),
                'sha256' => $data['sha256'],
            ]);
            $upload->update(['expires_at' => now()->addHours(48)]);

            return response()->json(['chunk_index' => $index, 'received' => true]);
        });
    }

    public function assemble(Request $request, ChunkUpload $upload)
    {
        $this->authorized($request, $upload);

        return DB::transaction(function () use ($upload) {
            $upload = ChunkUpload::query()->lockForUpdate()->findOrFail($upload->id);
            abort_unless(in_array($upload->status, ['uploading', 'assembling'], true), 409);

            if ($upload->status === 'uploading') {
                abort_unless($upload->parts()->count() === $upload->total_chunks, 409, 'Some chunks have not been uploaded.');
            }

            $start = $upload->assembled_chunks;
            $end = min($start + self::ASSEMBLE_BATCH, $upload->total_chunks);
            $local = Storage::disk('local');
            $destination = $local->path($upload->assembledPath());
            if (!is_dir(dirname($destination)) && !mkdir(dirname($destination), 0700, true) && !is_dir(dirname($destination))) {
                abort(507, 'Not enough storage to assemble this file.');
            }

            $out = fopen($destination, 'c+b');
            abort_unless($out !== false, 507, 'Cannot open assembled file.');

            try {
                $offset = min($start * $upload->chunk_size, $upload->size);
                if (!ftruncate($out, $offset) || fseek($out, $offset) !== 0) {
                    abort(507, 'Could not continue assembling this file.');
                }

                for ($i = $start; $i < $end; $i++) {
                    $path = $local->path($upload->partPath($i));
                    $in = @fopen($path, 'rb');
                    abort_unless($in !== false, 409, "Chunk {$i} is missing. Re-upload this file.");
                    try {
                        $expected = (int) min($upload->chunk_size, $upload->size - $i * $upload->chunk_size);
                        $written = stream_copy_to_stream($in, $out, $expected);
                        abort_unless($written === $expected, 507, 'Not enough space to assemble the uploaded file.');
                    } finally {
                        fclose($in);
                    }
                }
                fflush($out);
            } finally {
                fclose($out);
            }

            $upload->update([
                'assembled_chunks' => $end,
                'status' => 'assembling',
                'expires_at' => now()->addHours(48),
            ]);

            return response()->json([
                'assembled_chunks' => $end,
                'total_chunks' => $upload->total_chunks,
                'status' => $end === $upload->total_chunks ? 'ready' : 'assembling',
            ]);
        });
    }

    public function complete(Request $request, ChunkUpload $upload)
    {
        $target = $this->authorized($request, $upload);
        $local = Storage::disk('local');
        $result = DB::transaction(function () use ($upload, $target, $request, $local) {
            $upload = ChunkUpload::query()->lockForUpdate()->findOrFail($upload->id);
            if ($upload->status === 'completed') {
                return ['id' => $upload->result_id, 'name' => $upload->name, 'size' => $upload->size];
            }
            abort_unless(
                $upload->status === 'assembling' && $upload->assembled_chunks === $upload->total_chunks,
                409, 'Complete the file assembly first: '.$upload->status.', '.$upload->assembled_chunks.'/'.$upload->total_chunks
            );

            $src = $upload->assembledPath();
            abort_unless(
                $local->exists($src) && $local->size($src) === $upload->size,
                409,
                'Assembled file is incomplete: expected '.$upload->size.' bytes, found '.($local->exists($src) ? $local->size($src) : 'missing')
            );

            $extension = strtolower(pathinfo($upload->name, PATHINFO_EXTENSION));
            $extension = preg_match('/^[a-z0-9]{1,20}$/', $extension) ? $extension : '';
            $destination = $upload->target_type.'s/'.$target->id.'/'.Str::uuid().($extension ? '.'.$extension : '');

            abort_unless($local->move($src, $destination), 507, 'Unable to save assembled file.');

            try {
                $attrs = [
                    'name' => $upload->name,
                    'path' => $destination,
                    'disk' => 'local',
                    'mime_type' => $upload->mime_type,
                    'extension' => $extension ?: null,
                    'size' => $upload->size,
                    'uploaded_by' => $request->user()->id,
                ];
                if ($upload->target_type === 'project') {
                    $attrs['tags'] = [];
                }
                $file = $target->files()->create($attrs);
                $upload->update(['status' => 'completed', 'result_id' => $file->id]);
            } catch (\Throwable $exception) {
                $local->move($destination, $src);
                throw $exception;
            }

            return ['id' => $file->id, 'name' => $file->name, 'size' => $file->size];
        });

        // Best effort cleanup. Expired uploads are also removed by uploads:prune.
        try {
            $local->deleteDirectory($upload->folder());
        } catch (\Throwable $exception) {
            report($exception);
        }

        return response()->json(['file' => $result]);
    }

    public function destroy(Request $request, ChunkUpload $upload)
    {
        $this->authorized($request, $upload);
        abort_if($upload->status === 'completed', 409, 'Cannot cancel a completed upload.');

        DB::transaction(function () use ($upload) {
            $locked = ChunkUpload::query()->lockForUpdate()->findOrFail($upload->id);
            abort_if($locked->status === 'completed', 409);
            $locked->delete();
        });

        Storage::disk('local')->deleteDirectory($upload->folder());

        return response()->noContent();
    }
}
