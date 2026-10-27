<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TaskEditorImagesTest extends TestCase
{
    use RefreshDatabase;

    private function task(User $user): Task
    {
        $task = Task::create([
            'title' => 'Editor image',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
        ]);
        $task->assignedUsers()->attach($user->id);

        return $task;
    }

    public function test_editor_images_become_private_webp_files_without_originals(): void
    {
        if (! extension_loaded('gd') || ! function_exists('imagewebp')) {
            $this->markTestSkipped('GD WebP is required for editor image conversion.');
        }

        Storage::fake('local');
        $user = User::factory()->create();
        $task = $this->task($user);

        $image = imagecreatetruecolor(140, 90);
        imagefill($image, 0, 0, imagecolorallocate($image, 20, 30, 40));
        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);

        $original = 'tasks/'.$task->id.'/original.png';
        Storage::disk('local')->put($original, $png);
        $file = $task->files()->create([
            'name' => 'original.png',
            'path' => $original,
            'disk' => 'local',
            'mime_type' => 'image/png',
            'extension' => 'png',
            'size' => strlen($png),
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user);
        $this->postJson('/tasks/'.$task->id.'/files/'.$file->id.'/editor-image')
            ->assertOk()->assertJsonPath('id', $file->id);
        $file->refresh();
        $this->assertSame('image/webp', $file->mime_type);
        $this->assertSame('webp', $file->extension);
        $this->assertStringContainsString('/editor-images/', $file->path);
        Storage::disk('local')->assertExists($file->path);
        Storage::disk('local')->assertMissing($original);

        $this->get('/tasks/'.$task->id.'/files/'.$file->id.'/image')
            ->assertOk()->assertHeader('Content-Type', 'image/webp');

        $this->postJson('/tasks/'.$task->id.'/files/'.$file->id.'/editor-image')
            ->assertOk()->assertJsonPath('id', $file->id);

        $this->actingAs(User::factory()->create())
            ->get('/tasks/'.$task->id.'/files/'.$file->id.'/image')
            ->assertForbidden();
    }

    public function test_invalid_image_is_not_accepted_or_deleted(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $task = $this->task($user);
        $path = 'tasks/'.$task->id.'/document.png';
        Storage::disk('local')->put($path, 'This is not an image.');
        $file = $task->files()->create([
            'name' => 'document.png',
            'path' => $path,
            'disk' => 'local',
            'mime_type' => 'image/png',
            'extension' => 'png',
            'size' => 21,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user)->postJson('/tasks/'.$task->id.'/files/'.$file->id.'/editor-image')
            ->assertUnprocessable();
        Storage::disk('local')->assertExists($path);
        $this->assertSame($path, $file->fresh()->path);
    }
}
