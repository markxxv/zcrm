<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\Task;
use App\Models\TaskFile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileThumbnailsTest extends TestCase
{
    use RefreshDatabase;

    private function project(User $owner): Project
    {
        $project = Project::create([
            'name' => 'Images',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        $project->members()->attach($owner->id);

        return $project;
    }

    private function task(User $assignee): Task
    {
        $task = Task::create([
            'title' => 'Prepare imagery',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
        ]);
        $task->assignedUsers()->attach($assignee->id);

        return $task;
    }

    private function image(string $path): string
    {
        $bytes = UploadedFile::fake()->image('landscape.png', 640, 320)->get();
        Storage::disk('local')->put($path, $bytes);

        return $bytes;
    }

    public function test_project_preview_is_cropped_to_square_webp_and_cached(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $project = $this->project($owner);
        $path = 'projects/'.$project->id.'/picture.png';
        $this->image($path);

        $file = $project->files()->create([
            'name' => 'picture.png',
            'path' => $path,
            'disk' => 'local',
            'mime_type' => 'image/png',
            'extension' => 'png',
            'size' => Storage::disk('local')->size($path),
            'uploaded_by' => $owner->id,
        ]);

        $url = '/projects/'.$project->id.'/files/'.$file->id.'/thumbnail';
        $first = $this->actingAs($owner)->get($url)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/webp')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $image = getimagesizefromstring($first->getContent());
        $this->assertSame(128, $image[0]);
        $this->assertSame(128, $image[1]);
        $this->assertSame(IMAGETYPE_WEBP, $image[2]);

        $folder = 'file-thumbnails/project/'.$file->id;
        $this->assertCount(1, Storage::disk('local')->files($folder));

        $this->get($url)->assertOk();
        $this->assertCount(1, Storage::disk('local')->files($folder));

        $this->actingAs(User::factory()->create())->get($url)->assertForbidden();

        $this->actingAs($owner)->delete('/projects/'.$project->id.'/files/'.$file->id)->assertRedirect();
        $this->assertFalse(Storage::disk('local')->directoryExists($folder));
    }

    public function test_task_thumbnail_works_in_task_drawer_and_linked_projects(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();
        $task = $this->task($owner);
        $project = $this->project($owner);
        $project->members()->attach($member->id);
        $task->projects()->attach($project->id);

        $path = 'tasks/'.$task->id.'/cover.jpg';
        Storage::disk('local')->put($path, UploadedFile::fake()->image('cover.jpg', 400, 600)->get());
        $file = $task->files()->create([
            'name' => 'cover.jpg',
            'path' => $path,
            'disk' => 'local',
            'extension' => 'jpg',
            'size' => Storage::disk('local')->size($path),
            'uploaded_by' => $owner->id,
        ]);

        $this->actingAs($owner)->get('/tasks/'.$task->id.'/files/'.$file->id.'/thumbnail')
            ->assertOk()->assertHeader('Content-Type', 'image/webp');

        $this->actingAs($member)->get('/projects/'.$project->id.'/task-files/'.$file->id.'/thumbnail')
            ->assertOk()->assertHeader('Content-Type', 'image/webp');

        $this->actingAs($member)->get('/tasks/'.$task->id.'/files/'.$file->id.'/thumbnail')
            ->assertForbidden();

        $this->actingAs($outsider)->get('/projects/'.$project->id.'/task-files/'.$file->id.'/thumbnail')
            ->assertForbidden();

        $other = $this->project($owner);
        $this->actingAs($owner)->get('/projects/'.$other->id.'/task-files/'.$file->id.'/thumbnail')
            ->assertNotFound();

        $this->actingAs($owner)->deleteJson('/tasks/'.$task->id.'/files/'.$file->id)->assertNoContent();
        $this->assertFalse(Storage::disk('local')->directoryExists('file-thumbnails/task/'.$file->id));
    }

    public function test_non_images_and_invalid_image_bytes_never_get_a_preview(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $project = $this->project($owner);

        $file = $project->files()->create([
            'name' => 'design.svg',
            'path' => 'projects/'.$project->id.'/design.svg',
            'disk' => 'local',
            'extension' => 'svg',
            'size' => 42,
            'uploaded_by' => $owner->id,
        ]);
        Storage::disk('local')->put($file->path, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

        $this->actingAs($owner)
            ->get('/projects/'.$project->id.'/files/'.$file->id.'/thumbnail')
            ->assertNotFound();

        $file->update(['name' => 'fake.png', 'extension' => 'png']);
        Storage::disk('local')->put($file->path, 'This is not an image.');
        $this->get('/projects/'.$project->id.'/files/'.$file->id.'/thumbnail')
            ->assertNotFound();

        $this->assertFalse(Storage::disk('local')->directoryExists('file-thumbnails/project/'.$file->id));
    }

    public function test_deleting_task_purges_its_cached_image_thumbnails(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $task = $this->task($owner);
        $path = 'tasks/'.$task->id.'/screen.png';
        $this->image($path);

        $file = $task->files()->create([
            'name' => 'screen.png',
            'path' => $path,
            'disk' => 'local',
            'extension' => 'png',
            'size' => Storage::disk('local')->size($path),
            'uploaded_by' => $owner->id,
        ]);

        $this->actingAs($owner)->get('/tasks/'.$task->id.'/files/'.$file->id.'/thumbnail')->assertOk();
        $this->assertTrue(Storage::disk('local')->directoryExists('file-thumbnails/task/'.$file->id));

        $task->delete();
        $this->assertFalse(Storage::disk('local')->directoryExists('file-thumbnails/task/'.$file->id));
    }
}
