<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TaskController extends Controller
{
    use AuthorizesRequests;
    
    public function index(Request $request)
    {
        // Create task
        if ($request->isMethod('post')) {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'required|in:low,medium,high,critical',
                'due_date' => 'required|date',
                'assigned_user_ids' => 'nullable|array',
                'assigned_user_ids.*' => 'exists:users,id',
            ]);

            $task = Task::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'priority' => $validated['priority'],
                'due_date' => $validated['due_date'],
            ]);

            // Auto-assign current user if no users specified
            $userIds = $validated['assigned_user_ids'] ?? [auth()->id()];
            $task->assignedUsers()->attach($userIds);

            return back();
        }

        // Update task
        if ($request->isMethod('patch') && $request->has('task_id')) {
            $task = Task::findOrFail($request->task_id);
            $this->authorize('update', $task);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'priority' => 'sometimes|in:low,medium,high,critical',
                'due_date' => 'sometimes|date',
                'is_completed' => 'sometimes|boolean',
                'assigned_user_ids' => 'nullable|array',
                'assigned_user_ids.*' => 'exists:users,id',
            ]);

            if (isset($validated['is_completed'])) {
                $validated['completed_at'] = $validated['is_completed'] ? now() : null;
            }

            $task->update($validated);

            if (isset($validated['assigned_user_ids'])) {
                $task->assignedUsers()->sync($validated['assigned_user_ids']);
            }

            return back();
        }

        // Delete task
        if ($request->isMethod('delete') && $request->has('task_id')) {
            $task = Task::findOrFail($request->task_id);
            $this->authorize('delete', $task);
            $task->delete();

            return back();
        }

        // Get tasks for display
        $date = $request->input('date', today()->toDateString());
        
        $tasks = Task::with('assignedUsers')
            ->whereHas('assignedUsers', function($query) {
                $query->where('user_id', auth()->id());
            })
            ->where(function($query) use ($date) {
                // Current day tasks (all) OR past incomplete tasks
                $query->whereDate('due_date', $date)
                      ->orWhere(function($q) use ($date) {
                          $q->whereDate('due_date', '<', $date)
                            ->where('is_completed', false);
                      });
            })
            ->orderBy('due_date')
            ->orderBy('created_at')
            ->get()
            ->groupBy(function($task) use ($date) {
                return $task->due_date->isSameDay($date) ? 'current' : 'past';
            });

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'selectedDate' => $date,
            'availableUsers' => \App\Models\User::select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
        ]);
    }
}