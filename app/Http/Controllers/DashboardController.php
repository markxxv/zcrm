<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        return Inertia::render('dashboard', [
            'today' => today()->toDateString(),
            'tasks' => Task::query()
                ->incomplete()
                ->whereHas('assignedUsers', fn ($query) => $query->whereKey($user->id))
                ->with([
                    'assignedUsers:id,name,email,avatar_path',
                    'projects' => fn ($query) => $query->visibleTo($user)->select(['projects.id', 'projects.name']),
                ])
                ->orderBy('due_date')
                ->orderByRaw("CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END")
                ->orderBy('id')
                ->get(),
            'availableUsers' => User::query()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path']),
            'availableProjects' => Project::query()->visibleTo($user)->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
