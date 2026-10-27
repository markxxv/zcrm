import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TaskEditor } from './task-editor';
import { PrioritySelector } from './priority-selector';
import { ProjectSelector } from './project-selector';
import type { TaskProject } from '@/types/task';
import { UserAssignment } from './user-assignment';
import { Task } from '@/types/task';
import { X, Trash2 } from 'lucide-react';

interface TaskDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: Array<{ id: number; name: string; email: string }>;
  availableProjects: TaskProject[];
}

export function TaskDrawer({ task, open, onOpenChange, availableUsers, availableProjects }: TaskDrawerProps) {
  const { data, setData, patch, delete: destroy, processing, reset } = useForm({
    task_id: 0,
    title: '',
    description: '',
    priority: 'medium' as const,
    due_date: '',
    assigned_user_ids: [] as number[],
    project_ids: [] as number[],
  });

  useEffect(() => {
    if (task) {
      setData({
        task_id: task.id,
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        due_date: task.due_date,
        assigned_user_ids: task.assigned_users.map(u => u.id),
        project_ids: (task.projects || []).filter(p => availableProjects.some(available => available.id === p.id)).map(p => p.id),
      });
    }
  }, [task, availableProjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    patch('/tasks', {
      preserveScroll: true,
      onSuccess: () => {
        onOpenChange(false);
        reset();
      },
    });
  };

  const handleDelete = () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    destroy('/tasks', {
      data: { task_id: task.id },
      preserveScroll: true,
      onSuccess: () => {
        onOpenChange(false);
        reset();
      },
    });
  };

  const handleAssignUser = (userId: number) => {
    setData('assigned_user_ids', [...data.assigned_user_ids, userId]);
  };

  const handleUnassignUser = (userId: number) => {
    setData('assigned_user_ids', data.assigned_user_ids.filter(id => id !== userId));
  };

  if (!task) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right" >
      <DrawerContent className="h-full w-full sm:min-w-[600px] ml-auto rounded-none outline-0">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-6 pt-4">
          <DrawerTitle className="text-lg font-light tracking-tight">Edit Task</DrawerTitle>
          <DrawerDescription className="sr-only">
            Edit task details, description, and due date
          </DrawerDescription>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </div>

        <form onSubmit={handleSubmit}  data-vaul-no-drag className="flex flex-1 flex-col overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                <Input
                  id="title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  placeholder="Task title"
                  className="text-[15px]"
                  disabled={processing}
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <PrioritySelector
                  value={data.priority}
                  onChange={(value) => setData('priority', value)}
                  disabled={processing}
                />
              </div>

              <ProjectSelector
                projects={availableProjects}
                value={data.project_ids}
                onChange={(ids) => setData('project_ids', ids)}
                disabled={processing}
              />

              {/* Assigned Users */}
              <div className="space-y-2 flex gap-4 items-center">
                <Label className="text-sm font-medium">Assigned Users</Label>
                <UserAssignment
                  assignedUsers={availableUsers.filter(u => 
                    data.assigned_user_ids.includes(u.id)
                  )}
                  availableUsers={availableUsers}
                  onAssign={handleAssignUser}
                  onUnassign={handleUnassignUser}
                  disabled={processing}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <TaskEditor
                  content={data.description}
                  onChange={(content) => setData('description', content)}
                  placeholder="Add a description..."
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-sm font-medium">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={data.due_date}
                  onChange={(e) => setData('due_date', e.target.value)}
                  disabled={processing}
                  className="text-[15px]"
                />
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="px-6 pb-3">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={processing}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-2">
                <DrawerClose asChild>
                  <Button type="button" variant="outline" size="sm" disabled={processing}>
                    Cancel
                  </Button>
                </DrawerClose>
                <Button type="submit" size="sm" disabled={processing}>
                  {processing ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}