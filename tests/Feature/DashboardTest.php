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
            ->component('tasks/index')
            ->where('selectedDate', today()->toDateString())
            ->has('tasks', 0)
            ->has('availableUsers')
            ->has('availableProjects')
        );
    }

    public function test_dashboard_uses_the_same_daily_tasks_and_project_visibility_as_tasks_page()
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
        $overdue = $create($user, today()->subDay()->toDateString());
        $overdue->projects()->attach([$visible->id, $hidden->id]);
        $completed = $create($user, today()->toDateString(), completed: true);
        $create($user, today()->subDay()->toDateString(), completed: true);
        $create($owner, today()->toDateString());

        $this->actingAs($user);

        foreach (['dashboard', 'tasks.index'] as $route) {
            $this->get(route($route))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('tasks/index')
                ->where('selectedDate', today()->toDateString())
                ->has('tasks.current', 2)
                ->where('tasks.current', fn ($tasks) => collect($tasks)->pluck('id')->sort()->values()->all()
                    === collect([$normal->id, $completed->id])->sort()->values()->all())
                ->has('tasks.past', 1)
                ->where('tasks.past.0.id', $overdue->id)
                ->has('tasks.past.0.projects', 1)
                ->where('tasks.past.0.projects.0.id', $visible->id)
                ->has('availableProjects', 1)
                ->where('availableProjects.0.id', $visible->id)
            );
        }

        $this->get(route('dashboard', ['date' => today()->addDay()->toDateString()]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('tasks/index')
                ->where('selectedDate', today()->addDay()->toDateString())
                ->has('tasks.current', 1)
                ->where('tasks.current.0.id', $future->id)
                ->has('tasks.past', 2)
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

    public function test_completing_a_task_from_dashboard_marks_it_completed_on_the_selected_day()
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
            ->component('tasks/index')
            ->has('tasks.current', 1)
            ->where('tasks.current.0.id', $task->id)
            ->where('tasks.current.0.is_completed', true)
        );
    }
}
