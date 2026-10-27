<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function update(User $user, Task $task)
    {
        return $task->assignedUsers->contains($user);
    }

    public function delete(User $user, Task $task)
    {
        return $task->assignedUsers->contains($user);
    }
}