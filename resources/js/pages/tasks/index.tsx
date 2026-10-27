import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Task, TaskGroup, TaskProject } from '@/types/task';
import { DatePickerHorizontal } from '@/components/tasks/date-picker-horizontal';
import { TaskList } from '@/components/tasks/task-list';
import { TaskInput } from '@/components/tasks/task-input';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { useState } from 'react';

interface TasksPageProps {
  tasks: TaskGroup;
  selectedDate: string;
  availableUsers: Array<{ id: number; name: string; email: string }>;
  availableProjects: TaskProject[];
}

export default function TasksIndex({ tasks, selectedDate, availableUsers, availableProjects }: TasksPageProps) {
  const currentTasks = tasks.current || [];
  const pastTasks = tasks.past || [];
  const [openDrawer, setOpenDrawer] = useState<Task | null>(null);

  const handleDateSelect = (date: string) => {
    router.get('/tasks', { date }, { preserveState: true });
  };

  const handleToggleComplete = (taskId: number) => {
    const task = [...currentTasks, ...pastTasks].find(t => t.id === taskId);
    if (!task) return;

    router.patch('/tasks', {
      task_id: taskId,
      is_completed: !task.is_completed,
    }, {
      preserveScroll: true,
    });
  };

  const handleCreateTask = (title: string) => {
    router.post('/tasks', {
      title,
      priority: 'medium',
      due_date: selectedDate,
    }, {
      preserveScroll: true,
    });
  };

  const handleOpenDrawer = (task: Task) => {
    setOpenDrawer(task);
  };

  const handleMoveToToday = (taskId: number) => {
    router.patch('/tasks', {
      task_id: taskId,
      due_date: new Date().toISOString().split('T')[0],
    }, {
      preserveScroll: true,
    });
  };

  const handleMoveToTomorrow = (taskId: number) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    router.patch('/tasks', {
      task_id: taskId,
      due_date: tomorrow.toISOString().split('T')[0],
    }, {
      preserveScroll: true,
    });
  };

  const handleDelete = (taskId: number) => {
    router.delete('/tasks', {
      data: { task_id: taskId },
      preserveScroll: true,
    });
  };

  

  const completedCount = [...currentTasks, ...pastTasks].filter(t => t.is_completed).length;
  const remainingCount = [...currentTasks, ...pastTasks].filter(t => !t.is_completed).length;

  return (
    <>
      <Head title="Tasks" />
      
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-baseline gap-3 mb-2">
              <h1 className="text-[32px] font-light tracking-tight text-foreground">
                Today
              </h1>
              <span className="text-sm font-light text-muted-foreground">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="h-px bg-sidebar-border/70 mt-6"></div>
          </div>

          {/* Date picker */}
          <DatePickerHorizontal
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />

          {/* Quick add input */}
          <TaskInput onCreateTask={handleCreateTask} />

          
          {/* Task list */}
          <TaskList
            currentTasks={currentTasks}
            pastTasks={pastTasks}
            onToggleComplete={handleToggleComplete}
            onOpenDrawer={handleOpenDrawer}
            onMoveToToday={handleMoveToToday}
            onMoveToTomorrow={handleMoveToTomorrow}
            onDelete={handleDelete}
          />

          {/* Task Drawer */}
          <TaskDrawer
            task={openDrawer}
            open={openDrawer !== null}
            onOpenChange={(open) => !open && setOpenDrawer(null)}
            availableUsers={availableUsers}
            availableProjects={availableProjects}
          />


          {/* Stats */}
          <div className="mt-12 flex items-center justify-center gap-8 text-xs text-muted-foreground">
            <span>{completedCount} completed</span>
            <span className="w-1 h-1 rounded-full bg-sidebar-border"></span>
            <span>{remainingCount} remaining</span>
          </div>
        </div>
      </div>
    </>
  );
}

TasksIndex.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;