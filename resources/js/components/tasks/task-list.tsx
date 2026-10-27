import { Task } from '@/types/task';
import { TaskItem } from './task-item';

interface TaskListProps {
  currentTasks: Task[];
  pastTasks: Task[];
  onToggleComplete: (taskId: number) => void;
  onOpenDrawer: (task: Task) => void;
  onMoveToToday: (taskId: number) => void;
  onMoveToTomorrow: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

export function TaskList(props: TaskListProps) {
  const { currentTasks, pastTasks, onToggleComplete, onOpenDrawer, onMoveToToday, onMoveToTomorrow, onDelete } = props;

  return (
    <>
      {/* Current tasks */}
      {currentTasks.length > 0 && (
        <div className="space-y-1">
          {currentTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onOpenDrawer={onOpenDrawer}
              onMoveToTomorrow={onMoveToTomorrow}
              onMoveToToday={onMoveToToday}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Past tasks section */}
      {pastTasks.length > 0 && (
        <div className="mt-8 opacity-40">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Past Tasks
            </h2>
            <div className="h-px bg-sidebar-border/70 flex-1"></div>
          </div>
          <div className="space-y-1">
            {pastTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onOpenDrawer={onOpenDrawer}
                onMoveToTomorrow={onMoveToTomorrow}
                onMoveToToday={onMoveToToday}
                onDelete={onDelete}
                />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {currentTasks.length === 0 && pastTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks for this day</p>
        </div>
      )}
    </>
  );
}