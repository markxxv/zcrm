<?php

namespace App\Providers;

use App\Models\Project;
use App\Models\User;
use App\Models\Task;
use App\Policies\ProjectPolicy;
use App\Policies\TaskPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('manage-users', fn (User $user): bool => $user->id === 1);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);
    }
}
