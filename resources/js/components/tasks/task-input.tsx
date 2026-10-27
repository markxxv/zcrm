import { Plus } from 'lucide-react';
import { useState, KeyboardEvent, type Ref } from 'react';

interface TaskInputProps {
  onCreateTask: (title: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  compact?: boolean;
  placeholder?: string;
}

export function TaskInput({ onCreateTask, inputRef, compact = false, placeholder = 'Add a task' }: TaskInputProps) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onCreateTask(value.trim());
      setValue('');
    }
  };

  return (
    <div className={compact ? "mb-5" : "mb-12"}>
      <div className={compact ? "flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3.5 transition-colors focus-within:bg-muted/60" : "bg-card rounded-lg p-4 flex items-center gap-4 focus-within:shadow-sm transition-all duration-200 border border-sidebar-border/70"}>
        <div className={compact ? "grid size-5 shrink-0 place-items-center text-muted-foreground" : "flex-shrink-0 w-8 h-8 rounded-full border border-sidebar-border flex items-center justify-center text-muted-foreground"}>
          <Plus className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={compact ? "min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70" : "flex-1 text-[15px] text-foreground placeholder-muted-foreground outline-none bg-transparent"}
        />
      </div>
    </div>
  );
}