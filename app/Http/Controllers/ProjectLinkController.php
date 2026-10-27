<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectLink;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectLinkController extends Controller
{
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url:http,https', 'max:4000'],
            'category' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:4000'],
            'pinned' => ['required', 'boolean'],
        ]);
        $url = strtolower(parse_url($data['url'], PHP_URL_HOST) ?? '');
        $path = strtolower(parse_url($data['url'], PHP_URL_PATH) ?? '');
        $data['kind'] = match (true) {
            $url === 'docs.google.com' && str_starts_with($path, '/document/') => 'docs',
            $url === 'docs.google.com' && str_starts_with($path, '/spreadsheets/') => 'sheets',
            $url === 'docs.google.com' && str_starts_with($path, '/presentation/') => 'slides',
            $url === 'drive.google.com' => 'drive',
            $url === 'figma.com' || str_ends_with($url, '.figma.com') => 'figma',
            default => 'web',
        };

        return $data;
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('view', $project);
        $project->links()->create($this->validated($request) + [
            'created_by' => $request->user()->id,
        ]);

        return back();
    }

    public function update(Request $request, Project $project, ProjectLink $link)
    {
        $this->authorize('view', $project);
        abort_unless($link->project_id === $project->id, 404);
        $link->update($this->validated($request));

        return back();
    }

    public function destroy(Project $project, ProjectLink $link)
    {
        $this->authorize('view', $project);
        abort_unless($link->project_id === $project->id, 404);
        $link->delete();

        return back();
    }
}
