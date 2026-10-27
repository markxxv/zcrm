import { MoreHorizontal, Pencil, Calendar, Trash2, RedoDot, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';

interface TaskActionsDropdownProps {
  task: Task;
  onEdit: (task: Task) => void;
  onMoveToTomorrow: (taskId: number) => void;
  onMoveToToday: (taskId: number) => void;
  onToggleComplete: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

export function TaskActionsDropdown({
  task,
  onEdit,
  onMoveToTomorrow,
  onMoveToToday,
  onToggleComplete,
  onDelete,
}: TaskActionsDropdownProps) {
  const isPastTask = new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(task)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Task
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onToggleComplete(task.id)}>
          {task.is_completed ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Mark Incomplete
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Mark Complete
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isPastTask ? (
          <DropdownMenuItem onClick={() => onMoveToToday(task.id)}>
            <Calendar className="mr-2 h-4 w-4" />
            Move to Today
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onMoveToTomorrow(task.id)}>
            <RedoDot className="mr-2 h-4 w-4" />
            Move to Tomorrow
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (confirm('Are you sure you want to delete this task?')) {
              onDelete(task.id);
            }
          }}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
          Delete Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}