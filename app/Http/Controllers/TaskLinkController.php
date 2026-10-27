<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskLink;
use Illuminate\Http\Request;

class TaskLinkController extends Controller
{
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url:http,https', 'max:4000'],
        ]);

        $host = strtolower(parse_url($data['url'], PHP_URL_HOST) ?? '');
        $path = strtolower(parse_url($data['url'], PHP_URL_PATH) ?? '');

        $data['kind'] = match (true) {
            $host === 'docs.google.com' && str_starts_with($path, '/document/') => 'docs',
            $host === 'docs.google.com' && str_starts_with($path, '/spreadsheets/') => 'sheets',
            $host === 'docs.google.com' && str_starts_with($path, '/presentation/') => 'slides',
            $host === 'drive.google.com' => 'drive',
            $host === 'figma.com' || str_ends_with($host, '.figma.com') => 'figma',
            default => 'web',
        };

        return $data;
    }

    public function store(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        $link = $task->links()->create($this->validated($request) + [
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['link' => $link], 201);
    }

    public function update(Request $request, Task $task, TaskLink $link)
    {
        $this->authorize('update', $task);
        abort_unless($link->task_id === $task->id, 404);

        $link->update($this->validated($request));

        return response()->json(['link' => $link]);
    }

    public function destroy(Task $task, TaskLink $link)
    {
        $this->authorize('update', $task);
        abort_unless($link->task_id === $task->id, 404);

        $link->delete();

        return response()->noContent();
    }
}
