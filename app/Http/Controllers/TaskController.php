<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TaskController extends Controller
{
    private function validateProjects(Request $request, array $ids): array
    {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        $allowed = Project::query()->whereIn('id', $ids)
            ->whereHas('members', fn ($q) => $q->whereKey($request->user()->id))
            ->pluck('id')->all();
        abort_unless(count($allowed) === count($ids), 403, 'Access to one or more projects is denied.');

        return $allowed;
    }

    public function index(Request $request)
    {
        if ($request->isMethod('post')) {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'priority' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
                'due_date' => ['required', 'date'],
                'assigned_user_ids' => ['sometimes', 'array'],
                'assigned_user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
                'project_ids' => ['sometimes', 'array'],
                'project_ids.*' => ['integer', 'distinct', 'exists:projects,id'],
            ]);
            $projectIds = $this->validateProjects($request, $validated['project_ids'] ?? []);
            $task = Task::create(collect($validated)->only(['title', 'description', 'priority', 'due_date'])->all());
            $task->assignedUsers()->sync($validated['assigned_user_ids'] ?? [$request->user()->id]);
            $task->projects()->sync($projectIds);

            return back();
        }

        if ($request->isMethod('patch') && $request->has('task_id')) {
            $task = Task::findOrFail($request->integer('task_id'));
            $this->authorize('update', $task);
            $validated = $request->validate([
                'title' => ['sometimes', 'required', 'string', 'max:255'],
                'description' => ['nullable', 'string'],
                'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'critical'])],
                'due_date' => ['sometimes', 'date'],
                'is_completed' => ['sometimes', 'boolean'],
                'assigned_user_ids' => ['sometimes', 'array'],
                'assigned_user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
                'project_ids' => ['sometimes', 'array'],
                'project_ids.*' => ['integer', 'distinct', 'exists:projects,id'],
            ]);
            if (array_key_exists('is_completed', $validated)) {
                $validated['completed_at'] = $validated['is_completed'] ? now() : null;
            }
            $task->update(collect($validated)->only([
                'title', 'description', 'priority', 'due_date', 'is_completed', 'completed_at',
            ])->all());
            if (array_key_exists('assigned_user_ids', $validated)) {
                $task->assignedUsers()->sync($validated['assigned_user_ids']);
            }
            if (array_key_exists('project_ids', $validated)) {
                $allowedIds = $this->validateProjects($request, $validated['project_ids']);
                // Preserve projects which this user cannot see or remove.
                $existingHiddenIds = $task->projects()->whereDoesntHave(
                    'members', fn ($q) => $q->whereKey($request->user()->id)
                )->pluck('projects.id')->all();
                $task->projects()->sync(array_unique(array_merge($existingHiddenIds, $allowedIds)));
            }

            return back();
        }

        if ($request->isMethod('delete') && $request->has('task_id')) {
            $task = Task::findOrFail($request->integer('task_id'));
            $this->authorize('delete', $task);
            $task->delete();

            return back();
        }

        $date = $request->date('date')?->toDateString() ?? today()->toDateString();
        $tasks = Task::query()
            ->with(['assignedUsers:id,name,email', 'projects:id,name'])
            ->whereHas('assignedUsers', fn ($q) => $q->whereKey($request->user()->id))
            ->where(fn ($q) => $q
                ->whereDate('due_date', $date)
                ->orWhere(fn ($sub) => $sub->whereDate('due_date', '<', $date)
                    ->where('is_completed', false)))
            ->orderBy('due_date')->orderBy('created_at')->get()
            ->groupBy(fn ($task) => $task->due_date->isSameDay($date) ? 'current' : 'past');

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'selectedDate' => $date,
            'availableUsers' => User::orderBy('name')->get(['id', 'name', 'email']),
            'availableProjects' => Project::query()
                ->whereHas('members', fn ($q) => $q->whereKey($request->user()->id))
                ->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
