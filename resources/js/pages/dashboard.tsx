import { TaskDrawer } from '@/components/tasks/task-drawer';
import { TaskInput } from '@/components/tasks/task-input';
import { UserAvatar } from '@/components/user-avatar';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { Task, TaskPriority, TaskProject } from '@/types/task';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, CalendarDays, Check, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface DashboardProps {
    today: string;
    tasks: Task[];
    availableUsers: { id: number; name: string; email: string; avatar: string | null }[];
    availableProjects: TaskProject[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

const priorityColors: Record<TaskPriority, string> = {
    low: 'bg-green-500',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    critical: 'bg-red-500',
};

function formatDate(value: string, long = false) {
    return new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', {
        month: long ? 'long' : 'short',
        day: 'numeric',
        weekday: long ? 'long' : undefined,
    });
}

export default function Dashboard({ today, tasks, availableUsers, availableProjects }: DashboardProps) {
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [completingTask, setCompletingTask] = useState<number | null>(null);
    const groups = [
        { key: 'overdue', title: 'Overdue', tasks: tasks.filter((task) => task.due_date.slice(0, 10) < today) },
        { key: 'today', title: 'Today', tasks: tasks.filter((task) => task.due_date.slice(0, 10) === today) },
        { key: 'upcoming', title: 'Upcoming', tasks: tasks.filter((task) => task.due_date.slice(0, 10) > today) },
    ];
    const overdueCount = groups[0].tasks.length;

    const completeTask = (task: Task) => {
        if (completingTask !== null) return;
        setCompletingTask(task.id);
        router.patch('/tasks', { task_id: task.id, is_completed: true }, {
            preserveScroll: true,
            onFinish: () => setCompletingTask(null),
        });
    };

    const createTask = (title: string) => {
        router.post('/tasks', { title, priority: 'medium', due_date: today }, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="mx-auto w-full max-w-4xl px-4 pt-4 pb-8 sm:px-8 sm:pt-6">
                <header className="relative isolate mb-6 overflow-hidden rounded-2xl bg-muted px-4 py-5 sm:px-6 sm:py-6">
                    <img
                        src="/img/mascot.webp"
                        alt=""
                        aria-hidden="true"
                        width={900}
                        height={900}
                        className="pointer-events-none absolute -right-2 -bottom-6 w-32 select-none sm:right-3 sm:-bottom-9 sm:w-44"
                    />
                    <div className="relative z-10 pr-24 sm:pr-40">
                        <p className="mb-2 text-xs text-muted-foreground">{formatDate(today, true)}</p>
                        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">My tasks</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span><strong className="font-semibold text-foreground">{tasks.length}</strong> open</span>
                            {overdueCount > 0 && (
                                <span className="font-medium text-red-600 dark:text-red-400">{overdueCount} overdue</span>
                            )}
                        </div>
                    </div>
                </header>

                <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold">Open tasks</h2>
                    <Link href="/tasks" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
                        <CalendarDays className="size-3.5" /> Calendar <ArrowUpRight className="size-3" />
                    </Link>
                </div>

                <TaskInput compact onCreateTask={createTask} placeholder="Add a task for today…" />

                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/40 px-4 py-12 text-center">
                        <CheckCircle2 className="size-8 text-green-500" />
                        <p className="text-sm font-medium">All caught up</p>
                        <p className="text-xs text-muted-foreground">No open tasks</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groups.filter((group) => group.tasks.length > 0).map((group) => (
                            <section key={group.key} aria-labelledby={'tasks-' + group.key}>
                                <h3 id={'tasks-' + group.key} className={cn(
                                    'mb-2 flex items-center gap-2 px-1 text-xs font-semibold',
                                    group.key === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-foreground',
                                )}>
                                    {group.title}
                                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{group.tasks.length}</span>
                                </h3>
                                <ul className="space-y-1.5">
                                    {group.tasks.map((task) => (
                                        <li key={task.id} className="group flex min-w-0 items-center gap-2 rounded-lg bg-muted/40 p-2 transition-colors hover:bg-muted sm:gap-3 sm:px-3">
                                            <button
                                                type="button"
                                                title="Mark complete"
                                                aria-label={'Complete ' + task.title}
                                                disabled={completingTask !== null}
                                                onClick={() => completeTask(task)}
                                                className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-green-500/10 hover:text-green-600 focus-visible:text-green-600 focus-visible:outline-2 focus-visible:outline-green-500 disabled:opacity-50 dark:hover:text-green-400"
                                            >
                                                <span className={cn('grid size-5 place-items-center rounded-full ring-1 ring-current', completingTask === task.id && 'text-green-500')}>
                                                    <Check className={cn('size-3 opacity-0 transition-opacity group-hover:opacity-70', completingTask === task.id && 'opacity-100')} />
                                                </span>
                                            </button>
                                            <button type="button" onClick={() => setEditingTask(task)} className="min-w-0 flex-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-ring">
                                                <span className="block text-sm font-medium break-words">{task.title}</span>
                                                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1.5 capitalize">
                                                        <span className={'size-1.5 rounded-full ' + priorityColors[task.priority]} />{task.priority}
                                                    </span>
                                                    {task.projects.map((project) => (
                                                        <span key={project.id} className="max-w-full truncate rounded bg-background px-1.5 py-0.5">{project.name}</span>
                                                    ))}
                                                </span>
                                            </button>
                                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                                <time dateTime={task.due_date.slice(0, 10)} className={cn(
                                                    'text-[11px] whitespace-nowrap text-muted-foreground',
                                                    group.key === 'overdue' && 'text-red-600 dark:text-red-400',
                                                )}>
                                                    {group.key === 'today' ? 'Today' : formatDate(task.due_date)}
                                                </time>
                                                {task.assigned_users.length > 0 && (
                                                    <div className="hidden -space-x-1.5 sm:flex" aria-label="Assigned users">
                                                        {task.assigned_users.slice(0, 3).map((user) => (
                                                            <UserAvatar key={user.id} user={user} className="size-6 ring-2 ring-background" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <TaskDrawer
                task={editingTask}
                open={editingTask !== null}
                onOpenChange={(open) => { if (!open) setEditingTask(null); }}
                availableUsers={availableUsers}
                availableProjects={availableProjects}
            />
        </AppLayout>
    );
}
