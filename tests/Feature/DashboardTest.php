<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('dashboard'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('today', today()->toDateString())
            ->has('tasks', 0)
            ->has('availableUsers')
            ->has('availableProjects')
        );
    }

    public function test_dashboard_only_shows_incomplete_assigned_tasks_ordered_by_due_date_and_priority()
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();
        $visible = Project::create(['name' => 'Visible project', 'status' => 'active', 'created_by' => $owner->id]);
        $hidden = Project::create(['name' => 'Hidden project', 'status' => 'active', 'created_by' => $owner->id]);
        $visible->members()->attach($user);
        $hidden->members()->attach($owner);

        $create = function (User $assignee, string $date, string $priority = 'medium', bool $completed = false) {
            $task = Task::create([
                'title' => 'Task',
                'due_date' => $date,
                'priority' => $priority,
                'is_completed' => $completed,
            ]);
            $task->assignedUsers()->attach($assignee);

            return $task;
        };

        $future = $create($user, today()->addDay()->toDateString());
        $normal = $create($user, today()->toDateString());
        $critical = $create($user, today()->toDateString(), 'critical');
        $overdue = $create($user, today()->subDay()->toDateString());
        $overdue->projects()->attach([$visible->id, $hidden->id]);
        $create($user, today()->toDateString(), completed: true);
        $create($owner, today()->toDateString());

        $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('tasks', 4)
            ->where('tasks.0.id', $overdue->id)
            ->where('tasks.1.id', $critical->id)
            ->where('tasks.2.id', $normal->id)
            ->where('tasks.3.id', $future->id)
            ->has('tasks.0.projects', 1)
            ->where('tasks.0.projects.0.id', $visible->id)
            ->has('availableProjects', 1)
            ->where('availableProjects.0.id', $visible->id)
        );
    }

    public function test_quick_add_creates_a_task_assigned_to_the_current_user()
    {
        $user = User::factory()->create();

        $this->actingAs($user)->from(route('dashboard'))->post(route('tasks.index'), [
            'title' => 'New task',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
        ])->assertRedirect(route('dashboard'));

        $this->assertTrue($user->assignedTasks()->where('title', 'New task')->exists());
    }

    public function test_completing_a_task_from_dashboard_removes_it_from_open_tasks()
    {
        $user = User::factory()->create();
        $task = Task::create([
            'title' => 'Open task',
            'priority' => 'medium',
            'due_date' => today()->toDateString(),
            'is_completed' => false,
        ]);
        $task->assignedUsers()->attach($user);

        $this->actingAs($user)->from(route('dashboard'))->patch(route('tasks.index'), [
            'task_id' => $task->id,
            'is_completed' => true,
        ])->assertRedirect(route('dashboard'));

        $this->assertTrue($task->fresh()->is_completed);
        $this->get(route('dashboard'))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('tasks', 0)
        );
    }
}
