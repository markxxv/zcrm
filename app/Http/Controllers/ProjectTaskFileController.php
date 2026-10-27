<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Support\FileThumbnail;

class ProjectTaskFileController extends Controller
{
    private function checkProject(Project $project, TaskFile $file): void
    {
        $this->authorize('view', $project);

        abort_unless(
            $project->tasks()->whereKey($file->task_id)->exists(),
            404
        );
    }

    public function thumbnail(Project $project, TaskFile $file)
    {
        $this->checkProject($project, $file);

        return FileThumbnail::response($file);
    }

    public function download(Project $project, TaskFile $file)
    {
        $this->checkProject($project, $file);

        abort_unless(Storage::disk($file->disk)->exists($file->path), 404);

        return Storage::disk($file->disk)->download($file->path, $file->name, [
            'Content-Type' => 'application/octet-stream',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function update(Request $request, Project $project, TaskFile $file)
    {
        $this->checkProject($project, $file);
        $this->authorize('update', $file->task);

        $data = $request->validate(['name' => ['required', 'string', 'max:255']]);
        $file->update($data);

        return back();
    }

    public function destroy(Project $project, TaskFile $file)
    {
        $this->checkProject($project, $file);
        $this->authorize('update', $file->task);

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        return back();
    }
}
