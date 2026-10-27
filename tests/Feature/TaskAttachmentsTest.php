<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\TaskFile;
use App\Models\TaskLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskAttachmentsTest extends TestCase
{
    use RefreshDatabase;

    private function task(User $assignee): Task
    {
        $task = Task::create([
            'title' => 'Prepare brochure',
            'priority' => 'medium',
            'due_date' => now()->toDateString(),
        ]);
        $task->assignedUsers()->attach($assignee->id);

        return $task;
    }

    public function test_links_are_added_edited_and_deleted_inline_via_json_api(): void
    {
        $user = User::factory()->create();
        $task = $this->task($user);
        $base = '/tasks/'.$task->id;

        $this->actingAs($user)->getJson($base.'/attachments')
            ->assertOk()->assertJsonPath('files', [])->assertJsonPath('links', []);

        $response = $this->actingAs($user)->postJson($base.'/links', [
            'title' => 'Marketing plan',
            'url' => 'https://docs.google.com/spreadsheets/d/abc/edit',
        ])->assertCreated()->assertJsonPath('link.kind', 'sheets');

        $link = TaskLink::firstOrFail();
        $this->assertSame($task->id, $link->task_id);
        $this->assertSame($user->id, $link->created_by);

        $this->actingAs($user)->patchJson($base.'/links/'.$link->id, [
            'title' => 'Updated plan',
            'url' => 'https://docs.google.com/document/d/def/edit',
        ])->assertOk()->assertJsonPath('link.kind', 'docs');

        $this->actingAs($user)->getJson($base.'/attachments')
            ->assertJsonPath('links.0.title', 'Updated plan');

        $this->actingAs($user)->deleteJson($base.'/links/'.$link->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('task_links', ['id' => $link->id]);
    }

    public function test_upload_download_rename_and_delete_task_files(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $task = $this->task($user);
        $base = '/tasks/'.$task->id;

        $this->actingAs($user)->post($base.'/files', [
            'files' => [UploadedFile::fake()->create('brief.pdf', 24, 'application/pdf')],
        ], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('files.0.name', 'brief.pdf');

        $file = TaskFile::firstOrFail();
        $this->assertSame('local', $file->disk);
        $this->assertSame($user->id, $file->uploaded_by);
        $this->assertStringStartsWith('tasks/'.$task->id.'/', $file->path);
        Storage::disk('local')->assertExists($file->path);

        $this->actingAs($user)->get($base.'/files/'.$file->id.'/download')->assertOk();

        $this->actingAs($user)->patchJson($base.'/files/'.$file->id, ['name' => 'New brief.pdf'])
            ->assertOk()->assertJsonPath('file.name', 'New brief.pdf');

        $this->actingAs($user)->deleteJson($base.'/files/'.$file->id)->assertNoContent();
        Storage::disk('local')->assertMissing($file->path);
        $this->assertDatabaseMissing('task_files', ['id' => $file->id]);
    }

    public function test_task_deletion_also_cleans_up_stored_attachments(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $task = $this->task($user);

        $this->actingAs($user)->post('/tasks/'.$task->id.'/files', [
            'files' => [UploadedFile::fake()->create('report.txt', 10)],
        ], ['Accept' => 'application/json'])->assertCreated();

        $file = TaskFile::firstOrFail();
        $task->delete();
        Storage::disk('local')->assertMissing($file->path);
        $this->assertDatabaseMissing('task_files', ['id' => $file->id]);
    }

    public function test_attachments_are_restricted_to_task_assignees_or_authorized_project_members(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $task = $this->task($owner);

        $this->actingAs($owner)->postJson('/tasks/'.$task->id.'/links', [
            'title' => 'Design file',
            'url' => 'https://example.com/',
        ])->assertCreated();
        $link = TaskLink::firstOrFail();

        $this->actingAs($outsider)->getJson('/tasks/'.$task->id.'/attachments')->assertForbidden();
        $this->actingAs($outsider)->postJson('/tasks/'.$task->id.'/links', [
            'title' => 'Intrusion', 'url' => 'https://example.com',
        ])->assertForbidden();
        $this->actingAs($outsider)->deleteJson('/tasks/'.$task->id.'/links/'.$link->id)->assertForbidden();

        $this->actingAs($outsider)->post('/tasks/'.$task->id.'/files', [
            'files' => [UploadedFile::fake()->create('test.pdf', 5)],
        ], ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_attachment_ids_cannot_be_used_against_another_task(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $first = $this->task($owner);
        $second = $this->task($owner);

        $this->actingAs($owner)->postJson('/tasks/'.$first->id.'/links', [
            'title' => 'Shared docs', 'url' => 'https://example.com/docs',
        ])->assertCreated();
        $link = TaskLink::firstOrFail();

        $this->actingAs($owner)->post('/tasks/'.$first->id.'/files', [
            'files' => [UploadedFile::fake()->create('notes.txt', 3)],
        ], ['Accept' => 'application/json'])->assertCreated();
        $file = TaskFile::firstOrFail();

        $this->actingAs($owner)->deleteJson('/tasks/'.$second->id.'/links/'.$link->id)->assertNotFound();
        $this->actingAs($owner)->get('/tasks/'.$second->id.'/files/'.$file->id.'/download')->assertNotFound();
        $this->actingAs($owner)->deleteJson('/tasks/'.$second->id.'/files/'.$file->id)->assertNotFound();
        Storage::disk('local')->assertExists($file->path);
    }

    public function test_invalid_link_and_upload_are_rejected(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $task = $this->task($owner);

        $this->actingAs($owner)->postJson('/tasks/'.$task->id.'/links', [
            'title' => 'Unsafe URL', 'url' => 'javascript:alert(1)',
        ])->assertUnprocessable()->assertJsonValidationErrors('url');

        $this->actingAs($owner)->post('/tasks/'.$task->id.'/files', [
            'files' => [UploadedFile::fake()->create('large.zip', 22000)],
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('files.0');

        $this->assertDatabaseCount('task_links', 0);
        $this->assertDatabaseCount('task_files', 0);
    }

    public function test_guest_cannot_read_attachments(): void
    {
        $task = $this->task(User::factory()->create());
        $this->get('/tasks/'.$task->id.'/attachments')->assertRedirect('/login');
    }
}
