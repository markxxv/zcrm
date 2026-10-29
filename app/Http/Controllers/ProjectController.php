<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\TaskFile;
use App\Models\User;
use App\Support\ProjectFileLibrary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('projects/index', [
            'projects' => Project::query()
                ->visibleTo($request->user())
                ->select(['id', 'name', 'description', 'status', 'created_by'])
                ->withCount(['members', 'tasks'])
                ->withSum('files as files_size_bytes', 'size')
                ->addSelect([
                    'task_files_size_bytes' => TaskFile::query()
                        ->selectRaw('COALESCE(SUM(task_files.size), 0)')
                        ->join('project_task', 'project_task.task_id', '=', 'task_files.task_id')
                        ->whereColumn('project_task.project_id', 'projects.id'),
                ])
                ->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::in(['active', 'paused', 'archived'])],
            'member_ids' => ['sometimes', 'array'],
            'member_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $project = DB::transaction(function () use ($request, $data) {
            $project = Project::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'active',
                'created_by' => $request->user()->id,
            ]);
            $project->members()->sync(array_unique(array_merge(
                [$request->user()->id], $data['member_ids'] ?? []
            )));

            return $project;
        });

        return redirect()->route('projects.show', $project);
    }

    public function show(Request $request, Project $project)
    {
        $this->authorize('view', $project);

        $tab = $request->query('tab', 'main');
        if (!in_array($tab, ['main', 'files', 'links', 'access'], true)) {
            $tab = 'main';
        }

        $project->load(['members:id,name,email,avatar_path']);
        $tasks = $project->tasks()
            ->with([
                'assignedUsers:id,name,email,avatar_path',
                'projects' => fn ($query) => $query->visibleTo($request->user())->select(['projects.id', 'projects.name']),
            ])
            ->orderBy('is_completed')->orderBy('due_date')->get();

        $q = mb_substr(trim((string) $request->query('q', '')), 0, 150);
        $type = (string) $request->query('type', 'all');
        $sort = (string) $request->query('sort', 'newest');

        $filePage = null;
        if ($tab === 'files') {
            $filePage = ProjectFileLibrary::filtered($project, $q, $type, $sort)
                ->paginate(20)->withQueryString();

            $filePage->setCollection(
                ProjectFileLibrary::present($filePage->getCollection(), $project, $request->user())
            );
        }

        $recentFiles = ProjectFileLibrary::present(
            ProjectFileLibrary::filtered($project, '', 'all', 'newest')->limit(5)->get(),
            $project,
            $request->user()
        );

        $linkQuery = $project->links();
        if ($tab === 'links') {
            if ($q !== '') {
                $linkQuery->where(fn ($query) => $query
                    ->where('title', 'like', "%{$q}%")
                    ->orWhere('url', 'like', "%{$q}%")
                    ->orWhere('category', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%"));
            }
            if ($type !== 'all' && in_array($type, ['docs', 'sheets', 'slides', 'drive', 'figma', 'web'], true)) {
                $linkQuery->where('kind', $type);
            }
        }

        $accessQuery = $project->accesses();
        $canAccess = $request->user()->can('manageAccess', $project);
        if ($canAccess && $tab === 'access') {
            if ($q !== '') {
                $accessQuery->where(fn ($query) => $query
                    ->where('name', 'like', "%{$q}%")
                    ->orWhere('host', 'like', "%{$q}%")
                    ->orWhere('username', 'like', "%{$q}%"));
            }
            if ($type !== 'all' && in_array($type, ['Hosting', 'Database', 'DNS', 'Other'], true)) {
                $accessQuery->where('category', $type);
            }
        }

        return Inertia::render('projects/show', [
            'project' => $project->only(['id', 'name', 'description', 'status', 'created_by']) + [
                'members' => $project->members,
            ],
            'tasks' => $tasks,
            'pinnedLinks' => $project->links()->where('pinned', true)->latest()->limit(6)->get(),
            'recentFiles' => $recentFiles,
            'files' => $filePage,
            'links' => $tab === 'links' ? (match ($sort) {
                    'name' => $linkQuery->orderBy('title'),
                    'oldest' => $linkQuery->oldest(),
                    default => $linkQuery->latest(),
                })->paginate(25)->withQueryString() : null,
            'accesses' => $canAccess && $tab === 'access'
                ? $accessQuery->latest()->paginate(25)->withQueryString() : null,
            'counts' => ['files' => ProjectFileLibrary::query($project)->count(), 'links' => $project->links()->count()],
            'availableUsers' => User::query()->orderBy('name')->get(['id', 'name', 'email', 'avatar_path']),
            'availableProjects' => Project::query()
                ->visibleTo($request->user())
                ->orderBy('name')->get(['id', 'name']),
            'linkCategories' => $project->links()->whereNotNull('category')
                ->where('category', '!=', '')->distinct()->orderBy('category')
                ->limit(100)->pluck('category')->all(),
            'fileTagSuggestions' => $project->files()->latest()->limit(500)->get(['tags'])
                ->flatMap(fn ($file) => $file->tags ?? [])
                ->unique(fn ($tag) => mb_strtolower($tag))
                ->sort()->values()->all(),
            'canManage' => $request->user()->can('update', $project),
            'canAccessVault' => $canAccess,
            'filters' => ['tab' => $tab, 'q' => $q, 'type' => $type, 'sort' => $sort],
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $project->update($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::in(['active', 'paused', 'archived'])],
        ]));

        return back();
    }

    public function members(Request $request, Project $project)
    {
        $this->authorize('manageMembers', $project);
        $data = $request->validate([
            'member_ids' => ['present', 'array'],
            'member_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);
        $project->members()->sync(array_unique(array_merge(
            [$project->created_by], $data['member_ids']
        )));

        return back();
    }

    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        // Remove private storage objects before deleting database records.
        foreach ($project->files as $file) {
            \Illuminate\Support\Facades\Storage::disk($file->disk)->delete($file->path);
        }
        $project->delete();

        return redirect()->route('projects.index');
    }
}
