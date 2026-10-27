import { Download, Pencil, Trash2 } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import type { ProjectFile } from '@/types/project';
import { AttachmentIcon, bytes, displayDate, mutedButton, fileDownloadUrl } from './resources';

type Props = {
    projectId: number;
    file: ProjectFile;
    canEdit: boolean;
    onEdit: (file: ProjectFile) => void;
    onDelete: (file: ProjectFile) => void;
    compact?: boolean;
};

export function ProjectFileRow({ projectId, file, canEdit, onEdit, onDelete, compact = false }: Props) {
    const controlClass = compact
        ? 'grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:size-7'
        : mutedButton;

    return <div className={
        'group flex min-w-0 items-center ' +
        (compact ? 'gap-2 rounded-md py-1.5 hover:bg-muted/30' : 'gap-3 py-3.5')
    }>
        <AttachmentIcon file={file} compact={compact} />
        <a href={fileDownloadUrl(projectId, file)}
            className="min-w-0 flex-1"
            title={'Download ' + file.name}>
            <span className="block truncate text-xs font-medium group-hover:text-foreground">{file.name}</span>
            <span className={(compact ? 'mt-0.5' : 'mt-1') + ' block truncate text-[10px] text-muted-foreground'}>
                {compact
                    ? (file.task_title ? 'Task: ' + file.task_title + ' · ' : '') + bytes(file.size) + ' · ' + (file.uploader?.name || 'Unknown')
                    : (file.task_title ? 'Task: ' + file.task_title : (file.tags?.length ? file.tags.join(', ') : 'Project file')) + ' · ' + (file.extension || 'File')}
            </span>
        </a>
        {!compact && <span className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
            {file.uploader && <UserAvatar user={file.uploader} className="size-6" />}
            {bytes(file.size)} · {displayDate(file.created_at)}
        </span>}
        <div className={'flex shrink-0 items-center ' + (compact ? 'gap-0.5' : 'gap-1')}>
            {compact && file.uploader && <UserAvatar user={file.uploader} className="mr-1 size-5" />}
            <a href={fileDownloadUrl(projectId, file)}
                className={controlClass} title="Download" aria-label={'Download ' + file.name}>
                <Download className={compact ? 'size-3.5' : 'size-4'} />
            </a>
            {canEdit && <>
                <button type="button" className={controlClass}
                    onClick={() => onEdit(file)} title="Rename or manage file"
                    aria-label={'Edit ' + file.name}>
                    <Pencil className={compact ? 'size-3.5' : 'size-4'} />
                </button>
                <button type="button"
                    className={controlClass + ' hover:text-red-500'}
                    onClick={() => onDelete(file)}
                    title="Delete file" aria-label={'Delete ' + file.name}>
                    <Trash2 className={compact ? 'size-3.5' : 'size-4'} />
                </button>
            </>}
        </div>
    </div>;
}
