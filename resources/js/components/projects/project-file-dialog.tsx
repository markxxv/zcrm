import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ProjectFile } from '@/types/project';
import { AttachmentIcon, bytes, fieldClass, mutedButton, outlineButton, solidButton, fileDownloadUrl, fileActionUrl } from './resources';
import { UserAvatar } from '@/components/user-avatar';

type Props = {
    projectId: number;
    file: ProjectFile | null;
    onOpenChange: (open: boolean) => void;
};

export function ProjectFileDialog({ projectId, file, onOpenChange }: Props) {
    const [filename, setFilename] = useState('');
    const [tags, setTags] = useState('');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const base = file ? fileActionUrl(projectId, file) : '';
    useEffect(() => {
        if (!file) return;
        setFilename(file.name);
        setTags((file.tags || []).join(', '));
        setErrors({});
    }, [file]);
    const save = () => {
        if (!file || !filename.trim()) return;
        setBusy(true);
        router.patch(base, {
            name: filename.trim(),
            ...(file.source === 'project' ? { tags: tags.split(',').map(t => t.trim()).filter(Boolean) } : {}),
        }, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (e) => setErrors(e),
            onFinish: () => setBusy(false),
        });
    };
    const remove = () => {
        if (!file || !window.confirm('Permanently delete this file?')) return;
        router.delete(base, {
            preserveScroll: true, onSuccess: () => onOpenChange(false),
        });
    };
    return <Dialog open={!!file} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>File details</DialogTitle></DialogHeader>
            {file && <div className="grid gap-4">
                <div className="flex items-center gap-3">
                    <AttachmentIcon file={file} />
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">{bytes(file.size)} · uploaded by {file.uploader && <UserAvatar user={file.uploader} className="size-6" />}{file.uploader?.name || 'Unknown'}</span>
                </div>
                <label className="grid gap-2 text-xs">Filename<input className={fieldClass} value={filename} onChange={e => setFilename(e.target.value)} /></label>
                {file.task_title && <p className="text-xs text-muted-foreground">Attached to task: <span className="text-foreground">{file.task_title}</span></p>}
                {file.source === 'project' && <label className="grid gap-2 text-xs">Tags, separated by commas<input className={fieldClass} value={tags} onChange={e => setTags(e.target.value)} /></label>}
                {Object.values(errors).length > 0 && <p role="alert" className="text-xs text-red-600">{Object.values(errors)[0]}</p>}
                <div className="flex items-center justify-end gap-2">
                    <button type="button" className={mutedButton + ' mr-auto text-red-600'} onClick={remove}><Trash2 className="size-4" /> Delete</button>
                    <a href={fileDownloadUrl(projectId, file)} className={outlineButton}><Download className="size-4" /> Download</a>
                    <button type="button" className={solidButton} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
                </div>
            </div>}
        </DialogContent>
    </Dialog>;
}
