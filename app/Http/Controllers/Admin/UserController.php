<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    private function passwordRules(): array
    {
        return ['required', 'string', Password::min(12)->mixedCase()->numbers()->symbols()];
    }

    private function normalizedEmail(Request $request): void
    {
        if ($request->exists('email')) {
            $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        }
    }

    private function projectRules(): array
    {
        return [
            'project_ids' => ['sometimes', 'array'],
            'project_ids.*' => ['integer', 'distinct', 'exists:projects,id'],
        ];
    }

    public function index(Request $request)
    {
        $q = mb_substr(trim((string) $request->query('q', '')), 0, 120);

        $users = User::query()
            ->with('projects:id')
            ->withCount('projects')
            ->when($q !== '', fn ($query) => $query->where(fn ($search) => $search
                ->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($q).'%'])
                ->orWhereRaw('LOWER(email) LIKE ?', ['%'.mb_strtolower($q).'%'])))
            ->orderByRaw('CASE WHEN id = 1 THEN 0 ELSE 1 END')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'created_at' => $user->created_at?->toISOString(),
                'projects_count' => $user->projects_count,
                'project_ids' => $user->projects->pluck('id')->all(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'projects' => Project::query()->orderBy('name')->get(['id', 'name', 'created_by']),
            'filters' => ['q' => $q],
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizedEmail($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')],
            'password' => $this->passwordRules(),
            ...$this->projectRules(),
        ]);

        DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => trim($data['name']),
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
            // Accounts created by the superadmin are approved and can sign in immediately.
            $user->forceFill(['email_verified_at' => now()])->save();
            $user->projects()->sync($data['project_ids'] ?? []);
        });

        return back();
    }

    public function update(Request $request, User $user)
    {
        $this->normalizedEmail($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            ...$this->projectRules(),
        ]);

        DB::transaction(function () use ($user, $data) {
            $user->update([
                'name' => trim($data['name']),
                'email' => $data['email'],
            ]);

            if (array_key_exists('project_ids', $data)) {
                // Project creators must always retain membership in their own projects.
                $owned = Project::query()->where('created_by', $user->id)->pluck('id')->all();
                $user->projects()->sync(array_unique(array_merge($owned, $data['project_ids'])));
            }
        });

        return back();
    }

    public function password(Request $request, User $user)
    {
        abort_if($user->id === 1, 403, 'Change the superadmin password in account settings.');
        $data = $request->validate(['password' => $this->passwordRules()]);

        DB::transaction(function () use ($user, $data) {
            $user->forceFill([
                'password' => $data['password'],
                'remember_token' => \Illuminate\Support\Str::random(60),
            ])->save();
            // Revoke database-backed sessions, including sessions with an expired password.
            DB::table('sessions')->where('user_id', $user->id)->delete();
        });

        return back();
    }

    public function destroy(User $user)
    {
        abort_if($user->id === 1, 403, 'Superadmin cannot be deleted.');

        $references = [
            ['projects', 'created_by'],
            ['project_links', 'created_by'],
            ['project_accesses', 'created_by'],
            ['project_files', 'uploaded_by'],
            ['task_links', 'created_by'],
            ['task_files', 'uploaded_by'],
        ];

        foreach ($references as [$table, $column]) {
            if (DB::table($table)->where($column, $user->id)->exists()) {
                throw ValidationException::withMessages([
                    'user' => 'This user owns projects or content. Reassign or remove it before deleting the account.',
                ]);
            }
        }

        DB::transaction(function () use ($user) {
            $user->projects()->detach();
            $user->assignedTasks()->detach();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            $user->delete();
        });

        return back();
    }
}
