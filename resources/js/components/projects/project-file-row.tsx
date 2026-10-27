import { UserAvatar } from '@/components/user-avatar';
import type { ProjectFile } from '@/types/project';
import { AttachmentIcon, bytes, displayDate, fileDownloadUrl } from './resources';
import { ProjectFileActions } from './project-file-actions';

type Props = {
    projectId: number;
    file: ProjectFile;
    canEdit: boolean;
    onEdit: (file: ProjectFile) => void;
    onDelete: (file: ProjectFile) => void;
    compact?: boolean;
};

export function ProjectFileRow({ projectId, file, canEdit, onEdit, onDelete, compact = false }: Props) {

    return <div className={
        'group flex min-w-0 items-center ' +
        (compact ? 'gap-2 rounded-md py-1.5 hover:bg-muted/30' : 'gap-3 py-3.5')
    }>
        <AttachmentIcon file={file} projectId={projectId} compact={compact} />
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
        <div className="flex shrink-0 items-center gap-1">
            {compact && file.uploader && <UserAvatar user={file.uploader} className="mr-1 size-5" />}
            <ProjectFileActions projectId={projectId} file={file}
                canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} compact={compact} />
        </div>
    </div>;
}
