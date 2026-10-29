<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class ProjectVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private function project(User $owner, string $name): Project
    {
        $project = Project::create([
            'name' => $name,
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        $project->members()->attach($owner->id);

        return $project;
    }

    public function test_user_one_sees_all_projects_while_others_see_only_memberships(): void
    {
        $admin = User::factory()->create(); // id = 1
        $member = User::factory()->create();
        $other = User::factory()->create();
        $first = $this->project($other, 'Alpha');
        $second = $this->project($member, 'Beta');

        $this->assertSame(1, $admin->id);
        $this->assertFalse($first->members()->whereKey($admin->id)->exists());

        $this->actingAs($admin)->get('/projects')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('projects/index')
                ->has('projects', 2)
                ->where('projects.0.id', $first->id)
                ->where('projects.1.id', $second->id)
                ->etc());

        $this->actingAs($member)->get('/projects')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('projects', 1)
                ->where('projects.0.id', $second->id)
                ->etc());

        $this->actingAs($other)->get('/projects')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('projects', 1)
                ->where('projects.0.id', $first->id)
                ->etc());

        $this->actingAs($admin)->get('/projects/'.$first->id)->assertOk();
        $this->actingAs($admin)->get('/projects/'.$second->id)->assertOk();
        $this->actingAs($member)->get('/projects/'.$first->id)->assertForbidden();
        $this->actingAs($other)->get('/projects/'.$second->id)->assertForbidden();
    }

    public function test_project_files_are_accessible_to_admin_but_not_to_non_members(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $owner = User::factory()->create();
        $project = $this->project($owner, 'Private');
        $file = $project->files()->create([
            'name' => 'private.pdf',
            'path' => 'projects/'.$project->id.'/private.pdf',
            'disk' => 'local',
            'size' => 7,
            'uploaded_by' => $owner->id,
        ]);
        Storage::disk('local')->put($file->path, 'private');

        $url = '/projects/'.$project->id.'/files/'.$file->id.'/download';
        $this->actingAs($admin)->get($url)->assertOk();
        $this->actingAs($member)->get($url)->assertForbidden();
    }

    public function test_project_choices_include_all_for_admin_and_only_memberships_for_others(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $other = User::factory()->create();
        $first = $this->project($member, 'Alpha');
        $second = $this->project($other, 'Beta');

        $this->actingAs($admin)->get('/tasks')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('availableProjects', 2)
                ->etc());
        $this->actingAs($admin)->get('/projects/'.$first->id)->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('availableProjects', 2)
                ->etc());

        $this->actingAs($member)->get('/tasks')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('availableProjects', 1)
                ->where('availableProjects.0.id', $first->id)
                ->etc());
        $this->actingAs($member)->get('/projects/'.$first->id)->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('availableProjects', 1)
                ->etc());

        $payload = [
            'title' => 'Admin task',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
            'project_ids' => [$second->id],
        ];
        $this->actingAs($admin)->post('/tasks', $payload)->assertRedirect();
        $this->assertTrue(Task::where('title', 'Admin task')->firstOrFail()
            ->projects()->whereKey($second->id)->exists());

        $this->actingAs($member)->post('/tasks', array_merge($payload, [
            'title' => 'Unauthorized task',
        ]))->assertForbidden();
        $this->assertDatabaseMissing('tasks', ['title' => 'Unauthorized task']);
    }

    public function test_shared_tasks_do_not_expose_hidden_project_names(): void
    {
        User::factory()->create(); // admin
        $member = User::factory()->create();
        $other = User::factory()->create();
        $visible = $this->project($member, 'Visible');
        $hidden = $this->project($other, 'Hidden');
        $task = Task::create([
            'title' => 'Shared task',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
        ]);
        $task->projects()->attach([$visible->id, $hidden->id]);
        $task->assignedUsers()->attach($member->id);

        $this->actingAs($member)->get('/projects/'.$visible->id)->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('tasks', 1)
                ->has('tasks.0.projects', 1)
                ->where('tasks.0.projects.0.id', $visible->id)
                ->etc());

        $this->actingAs($member)->get('/tasks')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('tasks.current', 1)
                ->has('tasks.current.0.projects', 1)
                ->where('tasks.current.0.projects.0.id', $visible->id)
                ->etc());
    }
}
