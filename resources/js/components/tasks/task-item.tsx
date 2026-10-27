import { Task } from '@/types/task';
import { Check, Circle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskActionsDropdown } from './task-actions-dropdown';
import { UserAvatar } from '@/components/user-avatar';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: number) => void;
  onOpenDrawer: (task: Task) => void;
  onMoveToTomorrow: (taskId: number) => void;
  onMoveToToday: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

export function TaskItem({ task, onToggleComplete, onOpenDrawer, onMoveToTomorrow, onMoveToToday, onDelete }: TaskItemProps) {
  const priorityColors = {
    low: 'text-muted-foreground',
    medium: 'text-blue-500',
    high: 'text-amber-500',
    critical: 'text-red-500',
  };

  const taskTime = task.created_at 
    ? new Date(task.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    : '--:--';

  return (
    <div className="group relative bg-card rounded-lg transition-all duration-200 hover:shadow-sm border border-sidebar-border/70">
      <div className="flex items-center gap-4 p-4">
        {/* Completion toggle */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200",
            task.is_completed
              ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-black"
              : "border-sidebar-border hover:border-foreground text-muted-foreground"
          )}
        >
          {task.is_completed ? (
            <Check className="w-4 h-4" />
          ) : task.assigned_users && task.assigned_users.length > 0 ? (
            <span className="text-[10px] font-medium">
              {task.assigned_users[0].name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        {/* Time */}
        <span className="text-xs font-medium text-muted-foreground w-12 flex-shrink-0">
          {taskTime}
        </span>

        {/* Task title */}
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onOpenDrawer(task)}
        >
          <p className={cn(
            "text-[15px] font-normal transition-all duration-200",
            task.is_completed 
              ? "line-through text-muted-foreground" 
              : ""
          )}>
            {task.title}
          </p>
          {task.projects?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{task.projects.map(project => <span key={project.id} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{project.name}</span>)}</div>}
        </div>

        {task.assigned_users?.length > 0 && (
          <div className="hidden shrink-0 -space-x-2 sm:flex" aria-label="Assigned users">
            {task.assigned_users.slice(0, 3).map((user) => (
              <UserAvatar key={user.id} user={user} className="size-7 ring-2 ring-background" />
            ))}
          </div>
        )}

        {/* Actions dropdown */}
        <TaskActionsDropdown
            task={task}
            onEdit={onOpenDrawer}
            onMoveToTomorrow={onMoveToTomorrow}
            onMoveToToday={onMoveToToday}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
        />
        
      </div>
    </div>
  );
}