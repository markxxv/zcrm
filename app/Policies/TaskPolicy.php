<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function update(User $user, Task $task): bool
    {
        if ($task->assignedUsers()->whereKey($user->id)->exists()) {
            return true;
        }

        // Project members may edit a task only when they belong to every linked project.
        return $task->projects()->exists()
            && !$task->projects()->whereDoesntHave(
                'members', fn ($query) => $query->whereKey($user->id)
            )->exists();
    }

    public function delete(User $user, Task $task): bool
    {
        // Deleting a shared task affects all its projects.
        return $this->update($user, $task)
            && !$task->projects()->whereDoesntHave(
                'members', fn ($query) => $query->whereKey($user->id)
            )->exists();
    }
}
