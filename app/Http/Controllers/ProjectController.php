<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
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
                ->whereHas('members', fn ($q) => $q->whereKey($request->user()->id))
                ->withCount(['members', 'tasks'])
                ->orderBy('name')->get(['id', 'name', 'description', 'status', 'created_by']),
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

        $project->load(['members:id,name,email']);
        $tasks = $project->tasks()
            ->with(['assignedUsers:id,name,email', 'projects:id,name'])
            ->orderBy('is_completed')->orderBy('due_date')->get();

        $q = mb_substr(trim((string) $request->query('q', '')), 0, 150);
        $type = (string) $request->query('type', 'all');
        $sort = (string) $request->query('sort', 'newest');

        $fileQuery = $project->files()->with('uploader:id,name');
        if ($tab === 'files') {
            if ($q !== '') {
                $fileQuery->where(function ($query) use ($q) {
                    $query->where('name', 'like', "%{$q}%")
                        ->orWhere('extension', 'like', "%{$q}%")
                        ->orWhere('mime_type', 'like', "%{$q}%")
                        ->orWhere('tags', 'like', "%{$q}%")
                        ->orWhereHas('uploader', fn ($users) => $users->where('name', 'like', "%{$q}%"));
                });
            }
            if ($type !== 'all' && in_array($type, ['pdf', 'image', 'document', 'archive', 'other'], true)) {
                $groups = [
                    'pdf' => ['pdf'],
                    'image' => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg'],
                    'document' => ['txt', 'md', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'],
                    'archive' => ['zip', 'rar', '7z', 'tar', 'gz'],
                ];
                if ($type === 'other') {
                    $fileQuery->whereNotIn('extension', array_merge(...array_values($groups)));
                } else {
                    $fileQuery->whereIn('extension', $groups[$type]);
                }
            }
        }
        match ($sort) {
            'name' => $fileQuery->orderBy('name'),
            'oldest' => $fileQuery->oldest(),
            'size' => $fileQuery->orderByDesc('size'),
            default => $fileQuery->latest(),
        };
        $fileQuery->orderByDesc('id');

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
            'recentFiles' => $project->files()->with('uploader:id,name')->latest()->limit(5)->get(),
            'files' => $tab === 'files' ? $fileQuery->paginate(20)->withQueryString() : null,
            'links' => $tab === 'links' ? $linkQuery->orderByDesc('created_at')->paginate(25)->withQueryString() : null,
            'accesses' => $canAccess && $tab === 'access'
                ? $accessQuery->latest()->paginate(25)->withQueryString() : null,
            'counts' => ['files' => $project->files()->count(), 'links' => $project->links()->count()],
            'availableUsers' => User::query()->orderBy('name')->get(['id', 'name', 'email']),
            'availableProjects' => Project::query()
                ->whereHas('members', fn ($query) => $query->whereKey($request->user()->id))
                ->orderBy('name')->get(['id', 'name']),
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
            'member_ids' => ['required', 'array'],
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
