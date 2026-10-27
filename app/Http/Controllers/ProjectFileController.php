<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectFileController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('view', $project);
        $data = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['required', 'file', 'max:20480'],
        ]);

        foreach ($data['files'] as $upload) {
            $name = Str::limit(basename(str_replace('\\', '/', $upload->getClientOriginalName())), 255, '');
            $disk = config('filesystems.default', 'local');
            $path = $upload->store("projects/{$project->id}", $disk);

            try {
                $project->files()->create([
                    'name' => $name,
                    'path' => $path,
                    'disk' => $disk,
                    'mime_type' => $upload->getMimeType(),
                    'extension' => strtolower($upload->getClientOriginalExtension()),
                    'size' => $upload->getSize(),
                    'tags' => [],
                    'uploaded_by' => $request->user()->id,
                ]);
            } catch (\Throwable $e) {
                Storage::disk($disk)->delete($path);
                throw $e;
            }
        }

        return back();
    }

    public function update(Request $request, Project $project, ProjectFile $file)
    {
        $this->authorize('view', $project);
        abort_unless($file->project_id === $project->id, 404);
        abort_unless($project->created_by === $request->user()->id || $file->uploaded_by === $request->user()->id, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['string', 'max:40'],
        ]);
        $file->update([
            'name' => $data['name'],
            'tags' => array_values(array_unique($data['tags'] ?? [])),
        ]);

        return back();
    }

    public function download(Project $project, ProjectFile $file)
    {
        $this->authorize('view', $project);
        abort_unless($file->project_id === $project->id, 404);
        abort_unless(Storage::disk($file->disk)->exists($file->path), 404);

        return Storage::disk($file->disk)->download($file->path, $file->name, [
            'Content-Type' => 'application/octet-stream',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function destroy(Request $request, Project $project, ProjectFile $file)
    {
        $this->authorize('view', $project);
        abort_unless($file->project_id === $project->id, 404);
        abort_unless($project->created_by === $request->user()->id || $file->uploaded_by === $request->user()->id, 403);

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        return back();
    }
}
