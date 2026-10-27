<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_upload_a_square_webp_avatar(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('profile.avatar.store'), [
                'avatar' => UploadedFile::fake()->image('landscape.jpg', 800, 600),
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertNotNull($user->avatar_path);
        $this->assertStringEndsWith('.webp', $user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);

        $dimensions = getimagesizefromstring(Storage::disk('public')->get($user->avatar_path));
        $this->assertSame(320, $dimensions[0]);
        $this->assertSame(320, $dimensions[1]);
        $this->assertSame(IMAGETYPE_WEBP, $dimensions[2]);
        $this->assertSame(Storage::disk('public')->url($user->avatar_path), $user->avatar);
        $this->assertSame($user->avatar, $user->toArray()['avatar']);
        $this->assertArrayNotHasKey('avatar_path', $user->toArray());
    }

    public function test_replacing_and_removing_photo_cleans_up_old_storage(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.avatar.store'), [
            'avatar' => UploadedFile::fake()->image('first.png', 500, 600),
        ])->assertSessionHasNoErrors();

        $old = $user->fresh()->avatar_path;

        $this->actingAs($user)->post(route('profile.avatar.store'), [
            'avatar' => UploadedFile::fake()->image('second.jpg', 600, 500),
        ])->assertSessionHasNoErrors();

        $new = $user->fresh()->avatar_path;
        $this->assertNotEquals($old, $new);
        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($new);

        $this->actingAs($user)->delete(route('profile.avatar.destroy'))
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $this->assertNull($user->fresh()->avatar_path);
        $this->assertNull($user->fresh()->avatar);
        Storage::disk('public')->assertMissing($new);
    }

    public function test_invalid_uploads_are_rejected(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('profile.avatar.store'), [
            'avatar' => UploadedFile::fake()->create('readme.txt', 10, 'text/plain'),
        ])->assertSessionHasErrors('avatar');

        $this->actingAs($user)->post(route('profile.avatar.store'), [
            'avatar' => UploadedFile::fake()->image('tiny.png', 32, 32),
        ])->assertSessionHasErrors('avatar');

        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_guests_cannot_upload_or_remove_user_avatars(): void
    {
        $this->post(route('profile.avatar.store'))->assertRedirect(route('login'));
        $this->delete(route('profile.avatar.destroy'))->assertRedirect(route('login'));
    }
}
