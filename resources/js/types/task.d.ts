export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  is_completed: boolean;
  due_date: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_users: User[];
}

export interface TaskGroup {
  current?: Task[];
  past?: Task[];
}