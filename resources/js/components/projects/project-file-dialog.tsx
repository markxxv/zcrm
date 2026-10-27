import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, FilePenLine, Tag, Trash2 } from 'lucide-react';
import type { ProjectFile } from '@/types/project';
import { AttachmentIcon, bytes, fileDownloadUrl, fileActionUrl, outlineButton, solidButton } from './resources';
import { UserAvatar } from '@/components/user-avatar';
import { ProjectFormField, projectFieldInput } from './project-form-field';
import { ProjectResponsiveDialog } from './project-responsive-dialog';
import { ProjectChipsInput, normalizedChips } from './project-chips-input';

type Props = {
    projectId: number;
    file: ProjectFile | null;
    suggestions?: string[];
    onOpenChange: (open: boolean) => void;
    onDelete: (file: ProjectFile) => void;
};

export function ProjectFileDialog({
    projectId, file, suggestions = [], onOpenChange, onDelete,
}: Props) {
    const [filename, setFilename] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagDraft, setTagDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!file) return;
        setFilename(file.name);
        setTags(file.tags || []);
        setTagDraft('');
        setBusy(false);
        setErrors({});
    }, [file]);

    const save = () => {
        if (!file || busy) return;
        if (!filename.trim()) {
            setErrors({ name: 'Enter a filename.' });
            return;
        }
        const rawTags = [...tags, tagDraft.trim()];
        const trimmed = rawTags.filter((tag) => tag.trim());
        if (trimmed.length > 20 || trimmed.some((tag) => tag.length > 40)) {
            setErrors({ tags: 'Up to 20 tags, maximum 40 characters each.' });
            return;
        }
        const normalized = normalizedChips(rawTags, 20, 40);
        setBusy(true);
        setErrors({});
        router.patch(fileActionUrl(projectId, file), {
            name: filename.trim(),
            ...(file.source === 'project' ? { tags: normalized } : {}),
        }, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (issues) => setErrors(issues),
            onFinish: () => setBusy(false),
        });
    };

    return <ProjectResponsiveDialog open={!!file}
        onOpenChange={onOpenChange} disabled={busy}
        icon={FilePenLine} title="File details"
        description="Rename and organize this file">
        {file && <div className="space-y-4">
            <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted/25 p-2.5">
                <AttachmentIcon file={file} projectId={projectId} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{file.name}</p>
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="shrink-0">{bytes(file.size)}</span>
                        <span>·</span>
                        {file.uploader && <UserAvatar user={file.uploader} className="size-4" />}
                        <span className="min-w-0 truncate">{file.uploader?.name || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            {file.task_title && <p className="px-0.5 text-[11px] text-muted-foreground">
                Attached to task: <span className="font-medium text-foreground">{file.task_title}</span>
            </p>}

            <ProjectFormField id="file-details-name" icon={FilePenLine}
                title="Filename" error={errors.name}>
                <input id="file-details-name" autoFocus autoComplete="off" disabled={busy}
                    className={projectFieldInput} value={filename} maxLength={255}
                    onChange={(event) => { setFilename(event.target.value); setErrors((current) => ({ ...current, name: '' })); }}
                    onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); save(); } }} />
            </ProjectFormField>

            {file.source === 'project' && <ProjectChipsInput id="file-details-tags" label="Tags · optional"
                values={tags} onChange={setTags} draft={tagDraft} onDraftChange={setTagDraft}
                suggestions={suggestions} maxItems={20} maxLength={40}
                placeholder="Type a tag and press Enter" disabled={busy} error={errors.tags} />}

            {errors.general && <p role="alert" className="text-[11px] text-red-500">{errors.general}</p>}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button type="button" disabled={busy} onClick={() => onDelete(file)}
                    className="mr-auto inline-flex items-center gap-1.5 px-2 py-2 text-xs text-red-500 hover:text-red-600">
                    <Trash2 className="size-3.5" /> Delete
                </button>
                <a href={fileDownloadUrl(projectId, file)} className={outlineButton}>
                    <Download className="size-3.5" /> Download
                </a>
                <button type="button" disabled={busy} className={solidButton} onClick={save}>
                    {busy ? 'Saving…' : 'Save changes'}
                </button>
            </div>
        </div>}
    </ProjectResponsiveDialog>;
}
