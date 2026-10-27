<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TaskFileController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['required', 'file', 'max:20480'],
        ]);

        foreach ($data['files'] as $upload) {
            $name = Str::limit(basename(str_replace('\\', '/', $upload->getClientOriginalName())), 255, '');
            // The local disk is private. Never store task attachments on the public disk.
            $path = $upload->store("tasks/{$task->id}", 'local');

            abort_unless($path !== false, 500, 'File storage failed.');

            try {
                $task->files()->create([
                    'name' => $name,
                    'path' => $path,
                    'disk' => 'local',
                    'mime_type' => $upload->getMimeType(),
                    'extension' => strtolower($upload->getClientOriginalExtension()),
                    'size' => $upload->getSize(),
                    'uploaded_by' => $request->user()->id,
                ]);
            } catch (\Throwable $exception) {
                Storage::disk('local')->delete($path);
                throw $exception;
            }
        }

        return response()->json([
            'files' => $task->files()->orderByDesc('id')->get(),
        ], 201);
    }

    public function update(Request $request, Task $task, TaskFile $file)
    {
        $this->authorize('update', $task);
        abort_unless($file->task_id === $task->id, 404);

        $data = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $file->update($data);

        return response()->json(['file' => $file]);
    }

    public function download(Task $task, TaskFile $file)
    {
        $this->authorize('update', $task);
        abort_unless($file->task_id === $task->id, 404);
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404);

        return Storage::disk($file->disk)->download($file->path, $file->name, [
            'Content-Type' => 'application/octet-stream',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function destroy(Task $task, TaskFile $file)
    {
        $this->authorize('update', $task);
        abort_unless($file->task_id === $task->id, 404);

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        return response()->noContent();
    }
}
