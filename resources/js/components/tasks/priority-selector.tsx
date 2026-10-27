import { AlertCircle, ArrowDown, ArrowUp, Flame } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TaskPriority } from '@/types/task';
import { cn } from '@/lib/utils';

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
}

const priorities: { 
  value: TaskPriority; 
  label: string; 
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}[] = [
  { 
    value: 'low', 
    label: 'Low', 
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-800/30',
    icon: <ArrowDown className="h-3.5 w-3.5" />
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950/30',
    icon: <AlertCircle className="h-3.5 w-3.5" />
  },
  { 
    value: 'high', 
    label: 'High', 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/30',
    icon: <ArrowUp className="h-3.5 w-3.5" />
  },
  { 
    value: 'critical', 
    label: 'Critical', 
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950/30',
    icon: <Flame className="h-3.5 w-3.5" />
  },
];

export function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps) {
  const selectedPriority = priorities.find((p) => p.value === value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button"
          disabled={disabled}
          className="inline-flex items-center gap-2 text-sm hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-muted-foreground">Priority:</span>
          {selectedPriority && (
            <>
              <div className={cn(
                'flex h-5 w-5 items-center justify-center rounded',
                selectedPriority.bgColor,
                selectedPriority.color
              )}>
                {selectedPriority.icon}
              </div>
              <span className="font-medium">{selectedPriority.label}</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          {priorities.map((priority) => (
            <button type="button"
              key={priority.value}
              onClick={() => onChange(priority.value)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                "hover:bg-accent/50",
                value === priority.value && "bg-accent/60"
              )}
            >
              <div className={cn(
                'flex h-5 w-5 items-center justify-center rounded shrink-0',
                priority.bgColor,
                priority.color
              )}>
                {priority.icon}
              </div>
              <span className="font-medium">{priority.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}