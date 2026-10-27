import { Download, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProjectFile } from '@/types/project';
import { fileDownloadUrl } from './resources';

type Props = {
    projectId: number;
    file: ProjectFile;
    canEdit: boolean;
    onEdit: (file: ProjectFile) => void;
    onDelete: (file: ProjectFile) => void;
    compact?: boolean;
};

/** Shared file actions for Main, Files list and Files grid. */
export function ProjectFileActions({
    projectId, file, canEdit, onEdit, onDelete, compact = false,
}: Props) {
    return <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button type="button" aria-label={'Actions for ' + file.name}
                title="File actions"
                className={'grid shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground ' +
                    (compact ? 'size-8 sm:size-7' : 'size-8')}>
                <Ellipsis className="size-4" />
            </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6}
            className="z-[80] min-w-44 rounded-xl border-border/50 bg-popover p-1.5 shadow-xl">
            <DropdownMenuItem asChild className="gap-2.5 rounded-lg px-2.5 py-2 text-xs">
                <a href={fileDownloadUrl(projectId, file)}>
                    <Download className="size-4" />
                    Download
                </a>
            </DropdownMenuItem>
            {canEdit && <>
                <DropdownMenuItem className="gap-2.5 rounded-lg px-2.5 py-2 text-xs"
                    onSelect={() => onEdit(file)}>
                    <Pencil className="size-4" />
                    Edit details
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border/50" />
                <DropdownMenuItem className="gap-2.5 rounded-lg px-2.5 py-2 text-xs text-red-500 focus:bg-red-500/10 focus:text-red-500 [&_svg]:!text-red-500"
                    onSelect={() => onDelete(file)}>
                    <Trash2 className="size-4" />
                    Delete
                </DropdownMenuItem>
            </>}
        </DropdownMenuContent>
    </DropdownMenu>;
}
