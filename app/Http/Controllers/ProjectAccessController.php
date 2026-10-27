<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectAccess;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectAccessController extends Controller
{
    private function validated(Request $request, bool $updating = false): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category' => ['required', Rule::in(['Hosting', 'Database', 'DNS', 'Other'])],
            'host' => ['nullable', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255'],
            'secret' => [$updating ? 'nullable' : 'required', 'string', 'max:10000'],
            'notes' => ['nullable', 'string', 'max:10000'],
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('manageAccess', $project);
        $project->accesses()->create($this->validated($request) + [
            'created_by' => $request->user()->id,
        ]);

        return back();
    }

    public function update(Request $request, Project $project, ProjectAccess $access)
    {
        $this->authorize('manageAccess', $project);
        abort_unless($access->project_id === $project->id, 404);
        $data = $this->validated($request, true);
        if (empty($data['secret'])) {
            unset($data['secret']);
        }
        $access->update($data);

        return back();
    }

    public function reveal(Project $project, ProjectAccess $access)
    {
        $this->authorize('manageAccess', $project);
        abort_unless($access->project_id === $project->id, 404);

        \Illuminate\Support\Facades\Log::info('Project secret accessed', [
            'project_id' => $project->id,
            'access_id' => $access->id,
            'user_id' => auth()->id(),
        ]);

        return response()->json([
            'secret' => $access->secret,
            'notes' => $access->notes,
        ])->header('Cache-Control', 'private, no-store');
    }

    public function destroy(Project $project, ProjectAccess $access)
    {
        $this->authorize('manageAccess', $project);
        abort_unless($access->project_id === $project->id, 404);
        $access->delete();

        return back();
    }
}
