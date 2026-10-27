<?php

namespace App\Support;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProjectFileLibrary
{
    /**
     * A unified, paginatable query for direct project files and all files
     * attached to tasks linked to this project (including shared tasks).
     */
    public static function query(Project $project): Builder
    {
        $projectFiles = DB::table('project_files as f')
            ->join('users as uploader', 'uploader.id', '=', 'f.uploaded_by')
            ->where('f.project_id', $project->id)
            ->select([
                'f.id', 'f.name', 'f.mime_type', 'f.extension', 'f.size',
                'f.tags', 'f.uploaded_by', 'f.created_at',
                'uploader.name as uploader_name',
            ])
            ->selectRaw("'project' as source, NULL as task_id, NULL as task_title");

        // Explicit matching column order in both UNION arms.
        $taskFiles = DB::table('task_files as f')
            ->join('project_task as pivot', 'pivot.task_id', '=', 'f.task_id')
            ->join('tasks as task', 'task.id', '=', 'f.task_id')
            ->join('users as uploader', 'uploader.id', '=', 'f.uploaded_by')
            ->where('pivot.project_id', $project->id)
            ->select([
                'f.id', 'f.name', 'f.mime_type', 'f.extension', 'f.size',
            ])
            ->selectRaw('NULL as tags')
            ->addSelect(['f.uploaded_by', 'f.created_at', 'uploader.name as uploader_name'])
            ->selectRaw("'task' as source, f.task_id as task_id, task.title as task_title");

        return DB::query()->fromSub($projectFiles->unionAll($taskFiles), 'library')
            ->select('library.*');
    }

    public static function filtered(Project $project, string $search, string $type, string $sort): Builder
    {
        $query = self::query($project);
        if ($search !== '') {
            $query->where(function (Builder $files) use ($search) {
                foreach (['name', 'extension', 'mime_type', 'tags', 'uploader_name', 'task_title'] as $field) {
                    $files->orWhere($field, 'like', '%'.$search.'%');
                }
            });
        }

        $groups = [
            'pdf' => ['pdf'],
            'image' => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg'],
            'document' => ['txt', 'md', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'],
            'archive' => ['zip', 'rar', '7z', 'tar', 'gz'],
        ];

        if (isset($groups[$type])) {
            $query->whereIn('extension', $groups[$type]);
        } elseif ($type === 'other') {
            $query->where(function (Builder $files) use ($groups) {
                $files->whereNull('extension')->orWhereNotIn('extension', array_merge(...array_values($groups)));
            });
        }

        match ($sort) {
            'name' => $query->orderBy('name'),
            'oldest' => $query->orderBy('created_at'),
            'size' => $query->orderByDesc('size'),
            default => $query->orderByDesc('created_at'),
        };

        return $query->orderByDesc('id')->orderBy('source');
    }

    /**
     * Convert both DB sources to the existing React file shape, with metadata
     * identifying task attachments and their editable permissions.
     */
    public static function present(Collection $rows, Project $project, User $viewer): Collection
    {
        $uploaders = User::query()
            ->whereIn('id', $rows->pluck('uploaded_by')->unique())
            ->get(['id', 'name', 'email', 'avatar_path'])
            ->keyBy('id');

        $tasks = Task::query()
            ->whereIn('id', $rows->where('source', 'task')->pluck('task_id')->unique())
            ->get()
            ->keyBy('id');

        $editableTasks = $tasks->mapWithKeys(fn (Task $task) => [
            $task->id => $viewer->can('update', $task),
        ]);

        return $rows->map(function ($file) use ($project, $viewer, $uploaders, $editableTasks) {
            $isTask = $file->source === 'task';

            return [
                'id' => (int) $file->id,
                'source' => $file->source,
                'name' => $file->name,
                'mime_type' => $file->mime_type,
                'extension' => $file->extension,
                'size' => (int) $file->size,
                'tags' => $isTask ? [] : (json_decode($file->tags ?? '[]', true) ?: []),
                'uploaded_by' => (int) $file->uploaded_by,
                'created_at' => $file->created_at,
                'uploader' => $uploaders->get($file->uploaded_by),
                'task_id' => $isTask ? (int) $file->task_id : null,
                'task_title' => $isTask ? $file->task_title : null,
                'can_edit' => $isTask
                    ? (bool) ($editableTasks[$file->task_id] ?? false)
                    : ($project->created_by === $viewer->id || (int) $file->uploaded_by === $viewer->id),
            ];
        });
    }
}
