import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FolderKanban, ChevronDown, Check } from 'lucide-react';
import type { TaskProject } from '@/types/task';

interface Props {
    projects: TaskProject[];
    value: number[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
}

export function ProjectSelector({ projects, value, onChange, disabled }: Props) {
    const selected = projects.filter((project) => value.includes(project.id));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button type="button" disabled={disabled} className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70">
                    <span className="text-muted-foreground">Projects:</span>
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <span className="max-w-44 truncate font-medium">
                        {selected.length === 0 ? 'No project' : selected.length === 1 ? selected[0].name : selected.length + ' projects'}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
                <p className="px-2 pb-2 text-xs text-muted-foreground">Link to one or more projects</p>
                {projects.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">Create a project first.</p>}
                <div className="max-h-64 overflow-y-auto">
                    {projects.map((project) => (
                        <button type="button" key={project.id}
                            className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => onChange(value.includes(project.id) ? value.filter((id) => id !== project.id) : [...value, project.id])}>
                            <span className="truncate">{project.name}</span>
                            {value.includes(project.id) && <Check className="size-4" />}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
