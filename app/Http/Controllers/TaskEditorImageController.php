<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TaskEditorImageController extends Controller
{
    private const MAX_BYTES = 25165824; // 24 MiB compressed source.
    private const MAX_PIXELS = 12000000;
    private const MAX_SIDE = 2200;

    public function convert(Task $task, TaskFile $file)
    {
        $this->authorize('update', $task);
        abort_unless($file->task_id === $task->id, 404);
        abort_unless(extension_loaded('gd') && function_exists('imagewebp'), 503, 'WebP support is unavailable.');

        return DB::transaction(function () use ($task, $file) {
            $file = TaskFile::query()->lockForUpdate()->findOrFail($file->id);
            abort_unless($file->task_id === $task->id, 404);

            $url = route('tasks.editor-images.show', [$task, $file]);
            // Repeated completion calls must not encode the file a second time.
            if ($file->mime_type === 'image/webp' && $file->extension === 'webp'
                && str_ends_with($file->path, '.webp')) {
                return response()->json(['url' => $url, 'id' => $file->id, 'size' => $file->size]);
            }

            $disk = Storage::disk($file->disk);
            abort_unless($disk->exists($file->path), 404);
            $size = $disk->size($file->path);
            if ($size < 1 || $size > self::MAX_BYTES) {
                throw ValidationException::withMessages(['image' => 'Image must be 24 MB or smaller.']);
            }

            $sourcePath = $disk->path($file->path);
            $info = @getimagesize($sourcePath);
            if (! $info || ! in_array($info['mime'] ?? null, [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            ], true) || $info[0] < 1 || $info[1] < 1
                || $info[0] * $info[1] > self::MAX_PIXELS) {
                throw ValidationException::withMessages(['image' => 'Unsupported image or image dimensions.']);
            }

            $source = @imagecreatefromstring(file_get_contents($sourcePath));
            if ($source === false) {
                throw ValidationException::withMessages(['image' => 'Image could not be decoded.']);
            }

            $newPath = 'tasks/'.$task->id.'/'.Str::uuid().'.webp';
            $destination = $disk->path($newPath);
            if (! is_dir(dirname($destination)) && ! mkdir(dirname($destination), 0700, true) && ! is_dir(dirname($destination))) {
                abort(507, 'Could not create image directory.');
            }

            try {
                $ratio = min(1, self::MAX_SIDE / max($info[0], $info[1]));
                $width = max(1, (int) round($info[0] * $ratio));
                $height = max(1, (int) round($info[1] * $ratio));
                $canvas = imagecreatetruecolor($width, $height);
                abort_unless($canvas !== false, 500);
                try {
                    imagealphablending($canvas, false);
                    imagesavealpha($canvas, true);
                    $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
                    imagefill($canvas, 0, 0, $transparent);
                    abort_unless(imagecopyresampled($canvas, $source, 0, 0, 0, 0,
                        $width, $height, $info[0], $info[1]), 500);
                    abort_unless(imagewebp($canvas, $destination, 82) && is_file($destination), 500, 'WebP conversion failed.');
                } finally {
                    imagedestroy($canvas);
                }

                $oldPath = $file->path;
                $newSize = filesize($destination);
                $file->update([
                    'path' => $newPath,
                    'name' => pathinfo($file->name, PATHINFO_FILENAME).'.webp',
                    'mime_type' => 'image/webp',
                    'extension' => 'webp',
                    'size' => $newSize,
                ]);
                $disk->delete($oldPath);
            } catch (\Throwable $exception) {
                $disk->delete($newPath);
                throw $exception;
            } finally {
                imagedestroy($source);
            }

            return response()->json([
                'url' => $url, 'id' => $file->id, 'size' => $file->size,
            ]);
        });
    }

    public function show(Task $task, TaskFile $file)
    {
        $this->authorize('update', $task);
        abort_unless($file->task_id === $task->id && $file->mime_type === 'image/webp'
            && $file->extension === 'webp', 404);
        $disk = Storage::disk($file->disk);
        abort_unless($disk->exists($file->path), 404);

        return response()->file($disk->path($file->path), [
            'Content-Type' => 'image/webp',
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
