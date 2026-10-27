import { Download, Pencil } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import type { ProjectFile } from '@/types/project';
import { AttachmentIcon, bytes, displayDate, mutedButton, fileDownloadUrl } from './resources';

type Props = {
    projectId: number;
    file: ProjectFile;
    canEdit: boolean;
    onEdit: (file: ProjectFile) => void;
    compact?: boolean;
};

export function ProjectFileRow({ projectId, file, canEdit, onEdit, compact = false }: Props) {
    return <div className={
        'group flex min-w-0 items-center gap-3 ' +
        (compact ? 'rounded-lg py-2 hover:bg-muted/30' : 'py-3.5')
    }>
        <AttachmentIcon file={file} />
        <a href={fileDownloadUrl(projectId, file)}
            className="min-w-0 flex-1"
            title={'Download ' + file.name}>
            <span className="block truncate text-xs font-medium group-hover:text-foreground">{file.name}</span>
            <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                {compact
                    ? (file.task_title ? 'Task: ' + file.task_title + ' · ' : '') + bytes(file.size) + ' · ' + (file.uploader?.name || 'Unknown')
                    : (file.task_title ? 'Task: ' + file.task_title : (file.tags?.length ? file.tags.join(', ') : 'Project file')) + ' · ' + (file.extension || 'File')}
            </span>
        </a>
        {!compact && <span className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
            {file.uploader && <UserAvatar user={file.uploader} className="size-6" />}
            {bytes(file.size)} · {displayDate(file.created_at)}
        </span>}
        {compact && file.uploader && <UserAvatar user={file.uploader} className="size-6" />}
        <a href={'/projects/' + projectId + '/files/' + file.id + '/download'}
            className={mutedButton} title="Download" aria-label={'Download ' + file.name}>
            <Download className="size-4" />
        </a>
        {canEdit && <button type="button" className={mutedButton}
            onClick={() => onEdit(file)} title="Rename, tag or delete"
            aria-label={'Manage ' + file.name}>
            <Pencil className="size-4" />
        </button>}
    </div>;
}
