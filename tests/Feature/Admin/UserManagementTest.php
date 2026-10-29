<?php

namespace Tests\Feature\Admin;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'NewStrong!Password123';

    public function test_only_user_one_can_access_any_management_endpoint(): void
    {
        $admin = User::factory()->create();
        $member = User::factory()->create();
        $target = User::factory()->create();

        $this->assertSame(1, $admin->id);
        $this->actingAs($member)->get('/admin/users')->assertForbidden();
        $this->actingAs($member)->post('/admin/users', [
            'name' => 'Blocked', 'email' => 'blocked@example.com', 'password' => self::PASSWORD,
        ])->assertForbidden();
        $this->actingAs($member)->patch('/admin/users/'.$target->id, [
            'name' => 'Blocked', 'email' => 'blocked@example.com',
        ])->assertForbidden();
        $this->actingAs($member)->patch('/admin/users/'.$target->id.'/password', [
            'password' => self::PASSWORD,
        ])->assertForbidden();
        $this->actingAs($member)->delete('/admin/users/'.$target->id)->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'blocked@example.com']);

        $this->actingAs($admin)->get('/admin/users')->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->component('admin/users/index')
                ->has('users.data', 3)
                ->etc());
    }

    public function test_superadmin_can_create_verified_user_with_hashed_password_and_project_access(): void
    {
        $admin = User::factory()->create();
        $project = $this->project($admin, 'Alpha');

        $this->actingAs($admin)->post('/admin/users', [
            'name' => 'New Member',
            'email' => '  NEW.MEMBER@EXAMPLE.COM ',
            'password' => self::PASSWORD,
            'project_ids' => [$project->id],
        ])->assertRedirect();

        $user = User::where('email', 'new.member@example.com')->firstOrFail();
        $this->assertTrue(Hash::check(self::PASSWORD, $user->password));
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue($project->members()->whereKey($user->id)->exists());
        $this->actingAs($user)->get('/projects/'.$project->id)->assertOk();
    }

    public function test_duplicate_email_and_weak_password_are_rejected(): void
    {
        $admin = User::factory()->create();
        $this->actingAs($admin)->post('/admin/users', [
            'name' => 'Bad',
            'email' => strtoupper($admin->email),
            'password' => 'password',
        ])->assertSessionHasErrors(['email', 'password']);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_admin_can_edit_user_and_assign_projects_without_removing_owned_membership(): void
    {
        $admin = User::factory()->create();
        $user = User::factory()->create();
        $owned = $this->project($user, 'Owned');
        $another = $this->project($admin, 'Shared');

        $this->actingAs($admin)->patch('/admin/users/'.$user->id, [
            'name' => 'Updated',
            'email' => 'Updated@Example.com',
            'project_ids' => [$another->id],
        ])->assertRedirect();

        $this->assertSame('Updated', $user->fresh()->name);
        $this->assertSame('updated@example.com', $user->fresh()->email);
        $this->assertEqualsCanonicalizing(
            [$owned->id, $another->id],
            $user->fresh()->projects()->pluck('projects.id')->all()
        );
    }

    public function test_admin_can_reset_another_users_password_but_not_superadmins(): void
    {
        $admin = User::factory()->create();
        $user = User::factory()->create();
        $original = $user->password;

        $this->actingAs($admin)->patch('/admin/users/'.$user->id.'/password', [
            'password' => self::PASSWORD,
        ])->assertRedirect();

        $this->assertNotEquals($original, $user->fresh()->password);
        $this->assertTrue(Hash::check(self::PASSWORD, $user->fresh()->password));
        $this->assertNotNull($user->fresh()->remember_token);
        $this->actingAs($admin)->patch('/admin/users/'.$admin->id.'/password', [
            'password' => self::PASSWORD,
        ])->assertForbidden();
    }

    public function test_deletion_protects_superadmin_and_users_with_owned_content(): void
    {
        $admin = User::factory()->create();
        $owner = User::factory()->create();
        $unused = User::factory()->create();
        $project = $this->project($owner, 'Owned');

        $this->actingAs($admin)->delete('/admin/users/'.$admin->id)->assertForbidden();
        $this->actingAs($admin)->delete('/admin/users/'.$owner->id)->assertSessionHasErrors('user');
        $this->assertDatabaseHas('projects', ['id' => $project->id]);

        $project->members()->attach($unused->id);
        $this->actingAs($admin)->delete('/admin/users/'.$unused->id)->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $unused->id]);
        $this->assertDatabaseMissing('project_user', ['user_id' => $unused->id]);
    }

    public function test_pagination_and_search_only_return_matching_users(): void
    {
        $admin = User::factory()->create();
        User::factory()->create(['name' => 'Alice Example', 'email' => 'alice@example.com']);
        User::factory()->create(['name' => 'Bob Example', 'email' => 'bob@example.com']);

        $this->actingAs($admin)->get('/admin/users?q=ALICE')->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
                ->has('users.data', 1)
                ->where('users.data.0.email', 'alice@example.com')
                ->etc());
    }

    private function project(User $owner, string $name): Project
    {
        $project = Project::create(['name' => $name, 'status' => 'active', 'created_by' => $owner->id]);
        $project->members()->attach($owner->id);
        return $project;
    }
}
