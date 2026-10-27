<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectAccess;
use App\Models\ProjectFile;
use App\Models\ProjectLink;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectsTest extends TestCase
{
    use RefreshDatabase;

    private function project(User $owner): Project
    {
        $project = Project::create([
            'name' => 'Project Alpha',
            'description' => 'Test workspace',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        $project->members()->attach($owner->id);

        return $project;
    }

    public function test_creating_project_adds_its_owner_to_members(): void
    {
        $owner = User::factory()->create();

        $this->actingAs($owner)->post('/projects', [
            'name' => 'Website',
            'description' => 'New site',
            'status' => 'active',
        ])->assertRedirect();

        $project = Project::firstOrFail();
        $this->assertEquals($owner->id, $project->created_by);
        $this->assertTrue($project->members()->whereKey($owner->id)->exists());
    }

    public function test_project_index_includes_uploaded_file_storage_in_bytes(): void
    {
        $user = User::factory()->create();
        $first = $this->project($user);
        $first->update(['name' => 'Alpha']);
        $second = $this->project($user);
        $second->update(['name' => 'Beta']);

        $first->files()->create([
            'name' => 'one.pdf',
            'path' => 'projects/'.$first->id.'/one.pdf',
            'disk' => 'local',
            'extension' => 'pdf',
            'size' => 1048576,
            'uploaded_by' => $user->id,
        ]);
        $first->files()->create([
            'name' => 'two.pdf',
            'path' => 'projects/'.$first->id.'/two.pdf',
            'disk' => 'local',
            'extension' => 'pdf',
            'size' => 524288,
            'uploaded_by' => $user->id,
        ]);

        // A shared task contributes to both projects, while a project-only
        // task contributes to just one. Each attachment is counted once
        // within each project's total.
        $shared = Task::create([
            'title' => 'Shared work',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
        ]);
        $shared->projects()->attach([$first->id, $second->id]);
        $shared->files()->create([
            'name' => 'shared.pdf',
            'path' => 'tasks/'.$shared->id.'/shared.pdf',
            'disk' => 'local',
            'size' => 262144,
            'uploaded_by' => $user->id,
        ]);

        $firstOnly = Task::create([
            'title' => 'Only Alpha',
            'priority' => 'low',
            'due_date' => today()->toDateString(),
        ]);
        $firstOnly->projects()->attach($first->id);
        $firstOnly->files()->create([
            'name' => 'alpha.pdf',
            'path' => 'tasks/'.$firstOnly->id.'/alpha.pdf',
            'disk' => 'local',
            'size' => 524288,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user)->get('/projects')
            ->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->component('projects/index')
                ->has('projects', 2)
                ->where('projects.0.files_size_bytes', 1572864)
                ->where('projects.0.task_files_size_bytes', 786432)
                ->where('projects.1.files_size_bytes', null)
                ->where('projects.1.task_files_size_bytes', 262144)
                ->etc());
    }

    public function test_non_members_cannot_read_or_modify_projects(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($outsider)->get('/projects/'.$project->id)->assertForbidden();
        $this->actingAs($outsider)->patch('/projects/'.$project->id, ['name' => 'Changed'])->assertForbidden();
        $this->actingAs($outsider)->post('/projects/'.$project->id.'/links', [
            'title' => 'Private', 'url' => 'https://example.com', 'pinned' => false,
        ])->assertForbidden();
    }

    public function test_tasks_can_be_attached_to_multiple_projects(): void
    {
        $user = User::factory()->create();
        $first = $this->project($user);
        $second = $this->project($user);
        $second->update(['name' => 'Project Beta']);

        $this->actingAs($user)->post('/tasks', [
            'title' => 'Shared task',
            'priority' => 'high',
            'due_date' => now()->toDateString(),
            'project_ids' => [$first->id, $second->id],
        ])->assertRedirect();

        $task = Task::firstOrFail();
        $this->assertCount(2, $task->projects);
        $this->assertTrue($task->assignedUsers()->whereKey($user->id)->exists());

        $this->actingAs($user)->patch('/tasks', [
            'task_id' => $task->id,
            'project_ids' => [$second->id],
            'priority' => 'critical',
        ])->assertRedirect();

        $this->assertEquals([$second->id], $task->fresh()->projects->pluck('id')->all());
        $this->assertEquals('critical', $task->fresh()->priority);
    }

    public function test_non_members_cannot_attach_tasks_to_hidden_projects(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($outsider)->post('/tasks', [
            'title' => 'Unauthorized',
            'priority' => 'medium',
            'due_date' => now()->toDateString(),
            'project_ids' => [$project->id],
        ])->assertForbidden();

        $this->assertDatabaseMissing('tasks', ['title' => 'Unauthorized']);
    }

    public function test_links_detect_google_services_and_pin_to_main(): void
    {
        $owner = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($owner)->post('/projects/'.$project->id.'/links', [
            'title' => 'Content plan',
            'url' => 'https://docs.google.com/spreadsheets/d/example/edit',
            'category' => 'Content',
            'pinned' => true,
        ])->assertRedirect();

        $link = ProjectLink::firstOrFail();
        $this->assertSame('sheets', $link->kind);
        $this->assertTrue($link->pinned);
    }

    public function test_project_files_remain_private_and_have_scoped_downloads(): void
    {
        Storage::fake('local');

        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($owner)->post('/projects/'.$project->id.'/files', [
            'files' => [UploadedFile::fake()->create('brief.pdf', 12, 'application/pdf')],
        ])->assertRedirect();

        $file = ProjectFile::firstOrFail();
        Storage::disk('local')->assertExists($file->path);

        $this->actingAs($outsider)->get('/projects/'.$project->id.'/files/'.$file->id.'/download')->assertForbidden();
        $this->actingAs($owner)->get('/projects/'.$project->id.'/files/'.$file->id.'/download')->assertOk();
    }

    public function test_json_upload_reports_each_saved_file_for_main_and_files_uploader(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($owner)->post('/projects/'.$project->id.'/files', [
            'files' => [
                UploadedFile::fake()->create('contract.pdf', 32, 'application/pdf'),
                UploadedFile::fake()->create('photo.png', 16, 'image/png'),
            ],
        ], ['Accept' => 'application/json', 'X-Requested-With' => 'XMLHttpRequest'])
            ->assertCreated()
            ->assertJsonCount(2, 'files')
            ->assertJsonPath('files.0.name', 'contract.pdf')
            ->assertJsonPath('files.1.name', 'photo.png');

        $this->assertSame(2, $project->files()->count());
        foreach ($project->files as $file) {
            Storage::disk('local')->assertExists($file->path);
        }
    }

    public function test_json_upload_gives_field_errors_and_saves_nothing_if_one_file_is_too_large(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($owner)->post('/projects/'.$project->id.'/files', [
            'files' => [
                UploadedFile::fake()->create('small.txt', 1, 'text/plain'),
                UploadedFile::fake()->create('huge.zip', 22000, 'application/zip'),
            ],
        ], ['Accept' => 'application/json', 'X-Requested-With' => 'XMLHttpRequest'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('files.1');

        $this->assertDatabaseCount('project_files', 0);
    }

    public function test_json_upload_denies_unauthorized_member_without_storing_files(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($outsider)->post('/projects/'.$project->id.'/files', [
            'files' => [UploadedFile::fake()->create('secret.pdf', 1)],
        ], ['Accept' => 'application/json'])->assertForbidden();

        $this->assertDatabaseCount('project_files', 0);
    }

    public function test_vault_secrets_are_encrypted_and_owner_only(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = $this->project($owner);
        $project->members()->attach($member->id);

        $this->actingAs($owner)->post('/projects/'.$project->id.'/access', [
            'name' => 'Production VPS',
            'category' => 'Hosting',
            'host' => 'vps.example.com',
            'username' => 'deploy',
            'secret' => 'production-example-secret',
            'notes' => 'Private operational notes',
        ])->assertRedirect();

        $access = ProjectAccess::firstOrFail();
        $this->assertNotEquals('production-example-secret', $access->getRawOriginal('secret'));
        $this->assertSame('production-example-secret', $access->secret);

        $this->actingAs($member)->post('/projects/'.$project->id.'/access/'.$access->id.'/reveal')->assertForbidden();
        $this->actingAs($owner)->post('/projects/'.$project->id.'/access/'.$access->id.'/reveal')
            ->assertOk()->assertJsonPath('secret', 'production-example-secret');
        $this->actingAs($owner)->get('/projects/'.$project->id.'?tab=access')
            ->assertOk()->assertDontSee('production-example-secret');
    }

    public function test_file_or_access_from_another_project_cannot_be_accessed_by_id(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $first = $this->project($owner);
        $second = $this->project($owner);
        $access = $first->accesses()->create([
            'name' => 'DB', 'category' => 'Database', 'secret' => 'example-secret', 'created_by' => $owner->id,
        ]);

        $this->actingAs($owner)->post('/projects/'.$second->id.'/access/'.$access->id.'/reveal')->assertNotFound();
    }
}
