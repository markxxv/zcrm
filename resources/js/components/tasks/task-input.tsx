import { Plus } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';

interface TaskInputProps {
  onCreateTask: (title: string) => void;
}

export function TaskInput({ onCreateTask }: TaskInputProps) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onCreateTask(value.trim());
      setValue('');
    }
  };

  return (
    <div className="mb-12">
      <div className="bg-card rounded-lg p-4 flex items-center gap-4 focus-within:shadow-sm transition-all duration-200 border border-sidebar-border/70">
        <div className="flex-shrink-0 w-8 h-8 rounded-full border border-sidebar-border flex items-center justify-center text-muted-foreground">
          <Plus className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Add a task"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 text-[15px] text-foreground placeholder-muted-foreground outline-none bg-transparent"
        />
      </div>
    </div>
  );
}