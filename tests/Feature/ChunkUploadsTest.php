<?php

namespace Tests\Feature;

use App\Http\Controllers\ChunkUploadController;
use App\Models\ChunkUpload;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\Task;
use App\Models\TaskFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ChunkUploadsTest extends TestCase
{
    use RefreshDatabase;

    private function project(User $owner): Project
    {
        $project = Project::create([
            'name' => 'Upload target',
            'created_by' => $owner->id,
            'status' => 'active',
        ]);
        $project->members()->attach($owner->id);

        return $project;
    }

    private function task(User $assignee): Task
    {
        $task = Task::create([
            'title' => 'Attach assets',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
        ]);
        $task->assignedUsers()->attach($assignee->id);

        return $task;
    }

    private function startUpload(string $type, int $id, string $name, int $size, string $key = 'a'): array
    {
        return $this->postJson('/uploads/start', [
            'target_type' => $type,
            'target_id' => $id,
            'name' => $name,
            'size' => $size,
            'mime_type' => 'application/octet-stream',
            'client_key' => str_repeat($key, 64),
        ])->assertCreated()->json();
    }

    private function part(string $id, int $index, string $bytes): void
    {
        $this->post('/uploads/'.$id.'/chunks/'.$index, [
            'chunk' => UploadedFile::fake()->createWithContent("part-{$index}.bin", $bytes),
            'sha256' => hash('sha256', $bytes),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('chunk_index', $index);
    }

    public function test_a_three_megabyte_project_file_uploads_in_small_chunks_and_assembles_without_one_large_request(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $project = $this->project($owner);

        $size = 3 * 1024 * 1024 + 93;
        $bytes = str_repeat('z', $size);
        $this->actingAs($owner);
        $state = $this->startUpload('project', $project->id, 'large-video.mp4', $size);
        $id = $state['id'];

        $this->assertSame(ChunkUploadController::CHUNK_SIZE, $state['chunk_size']);
        $this->assertSame((int) ceil($size / $state['chunk_size']), $state['total_chunks']);

        $first = substr($bytes, 0, $state['chunk_size']);
        $this->part($id, 0, $first);

        // Selecting the same file again resumes its existing session.
        $resumed = $this->postJson('/uploads/start', [
            'target_type' => 'project',
            'target_id' => $project->id,
            'name' => 'large-video.mp4',
            'size' => $size,
            'client_key' => str_repeat('a', 64),
        ])->assertOk()->json();
        $this->assertSame($id, $resumed['id']);
        $this->assertSame([0], $resumed['received']);

        for ($i = 1; $i < $state['total_chunks']; $i++) {
            $this->part($id, $i, substr($bytes, $i * $state['chunk_size'], $state['chunk_size']));
        }

        $this->getJson('/uploads/'.$id)
            ->assertOk()->assertJsonCount($state['total_chunks'], 'received');

        $this->postJson('/uploads/'.$id.'/assemble')->assertOk()
            ->assertJsonPath('status', 'ready')
            ->assertJsonPath('assembled_chunks', $state['total_chunks']);

        $result = $this->postJson('/uploads/'.$id.'/complete');
        $this->assertSame(200, $result->getStatusCode(), $result->getContent());
        $result->assertJsonPath('file.name', 'large-video.mp4');

        $file = ProjectFile::findOrFail($result->json('file.id'));
        $this->assertSame($size, $file->size);
        $this->assertSame('local', $file->disk);
        Storage::disk('local')->assertExists($file->path);
        $this->assertSame(hash('sha256', $bytes), hash('sha256', Storage::disk('local')->get($file->path)));

        // Resume with the previous session ID even if the final response
        // was lost; no second file should be created.
        $this->postJson('/uploads/start', [
            'target_type' => 'project',
            'target_id' => $project->id,
            'name' => 'large-video.mp4',
            'size' => $size,
            'client_key' => str_repeat('a', 64),
            'resume_id' => $id,
        ])->assertOk()->assertJsonPath('status', 'completed')
            ->assertJsonPath('result_id', $file->id);

        // Retrying completion cannot create a duplicate entry.
        $this->postJson('/uploads/'.$id.'/complete')
            ->assertOk()->assertJsonPath('file.id', $file->id);
        $this->assertDatabaseCount('project_files', 1);
        $this->assertFalse(Storage::disk('local')->directoryExists('chunk-uploads/'.$id));
    }

    public function test_task_attachments_use_exactly_the_same_chunk_protocol(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $task = $this->task($owner);
        $this->actingAs($owner);

        $bytes = str_repeat('T', 700000);
        $upload = $this->startUpload('task', $task->id, 'task-file.bin', strlen($bytes), 'b');
        $id = $upload['id'];

        for ($i = 0; $i < $upload['total_chunks']; $i++) {
            $this->part($id, $i, substr($bytes, $i * $upload['chunk_size'], $upload['chunk_size']));
        }
        $this->postJson('/uploads/'.$id.'/assemble')
            ->assertJsonPath('status', 'ready');
        $result = $this->postJson('/uploads/'.$id.'/complete');
        $this->assertSame(200, $result->getStatusCode(), $result->getContent());
        $result->assertJsonPath('file.name', 'task-file.bin');

        $file = TaskFile::firstOrFail();
        $this->assertSame($task->id, $file->task_id);
        $this->assertSame(strlen($bytes), $file->size);
        $this->assertSame($bytes, Storage::disk('local')->get($file->path));

        $this->getJson('/tasks/'.$task->id.'/attachments')
            ->assertJsonPath('files.0.name', 'task-file.bin');
    }

    public function test_missing_parts_and_invalid_checksums_do_not_create_database_files(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $project = $this->project($owner);
        $this->actingAs($owner);

        $state = $this->startUpload('project', $project->id, 'incomplete.txt', 300000);
        $id = $state['id'];

        $this->post('/uploads/'.$id.'/chunks/0', [
            'chunk' => UploadedFile::fake()->createWithContent('part.bin', str_repeat('a', 262144)),
            'sha256' => str_repeat('0', 64),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('chunk');

        $this->postJson('/uploads/'.$id.'/assemble')->assertStatus(409);
        $this->postJson('/uploads/'.$id.'/complete')->assertStatus(409);
        $this->assertDatabaseCount('project_files', 0);

        $this->part($id, 0, str_repeat('a', 262144));
        $this->part($id, 0, str_repeat('a', 262144)); // Idempotent retry.
        $this->assertDatabaseCount('chunk_upload_parts', 1);
        $this->postJson('/uploads/'.$id.'/assemble')->assertStatus(409);
        $this->assertDatabaseCount('project_files', 0);
    }

    public function test_upload_authorization_is_rechecked_on_each_request(): void
    {
        Storage::fake('local');
        User::factory()->create(); // User #1 may still access projects without membership.
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = $this->project($owner);

        $this->actingAs($outsider)->postJson('/uploads/start', [
            'target_type' => 'project', 'target_id' => $project->id,
            'name' => 'secret.pdf', 'size' => 64,
            'client_key' => str_repeat('a', 64),
        ])->assertForbidden();

        $this->actingAs($owner);
        $state = $this->startUpload('project', $project->id, 'secure.pdf', 4);
        $id = $state['id'];

        $this->actingAs($outsider)->getJson('/uploads/'.$id)->assertForbidden();
        $this->actingAs($outsider)->postJson('/uploads/'.$id.'/assemble')->assertForbidden();
        $this->actingAs($outsider)->postJson('/uploads/'.$id.'/complete')->assertForbidden();
        $this->actingAs($outsider)->deleteJson('/uploads/'.$id)->assertForbidden();

        $this->actingAs($owner);
        $project->members()->detach($owner->id);
        $this->getJson('/uploads/'.$id)->assertForbidden();
    }

    public function test_cancel_and_prune_remove_temporary_parts_without_adding_files(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $project = $this->project($owner);
        $this->actingAs($owner);

        $first = $this->startUpload('project', $project->id, 'cancelled.dat', 1);
        $this->part($first['id'], 0, 'c');
        $this->deleteJson('/uploads/'.$first['id'])->assertNoContent();
        $this->assertDatabaseMissing('chunk_uploads', ['id' => $first['id']]);
        $this->assertFalse(Storage::disk('local')->directoryExists('chunk-uploads/'.$first['id']));

        $second = $this->startUpload('project', $project->id, 'expired.dat', 1, 'd');
        $this->part($second['id'], 0, 'd');
        ChunkUpload::findOrFail($second['id'])->update(['expires_at' => now()->subHour()]);
        $this->getJson('/uploads/'.$second['id'])->assertStatus(410);
        Artisan::call('uploads:prune');
        $this->assertDatabaseMissing('chunk_uploads', ['id' => $second['id']]);
        $this->assertFalse(Storage::disk('local')->directoryExists('chunk-uploads/'.$second['id']));
        $this->assertDatabaseCount('project_files', 0);
    }

    public function test_max_size_is_one_gigabyte_and_guests_cannot_start_uploads(): void
    {
        $owner = User::factory()->create();
        $project = $this->project($owner);
        $payload = [
            'target_type' => 'project', 'target_id' => $project->id,
            'name' => 'oversized.zip', 'size' => ChunkUploadController::MAX_FILE_SIZE + 1,
            'client_key' => str_repeat('a', 64),
        ];

        $this->postJson('/uploads/start', $payload)->assertUnauthorized();
        $this->actingAs($owner)->postJson('/uploads/start', $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('size');
    }
}
