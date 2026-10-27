<?php

namespace App\Http\Controllers;

use App\Models\Task;

class TaskAttachmentController extends Controller
{
    public function index(Task $task)
    {
        $this->authorize('update', $task);

        return response()->json([
            'files' => $task->files()->orderByDesc('id')->get(),
            'links' => $task->links()->orderByDesc('id')->get(),
        ])->header('Cache-Control', 'private, no-store');
    }
}
