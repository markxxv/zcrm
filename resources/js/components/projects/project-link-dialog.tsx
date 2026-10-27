import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ProjectLink } from '@/types/project';
import { fieldClass, mutedButton, outlineButton, solidButton } from './resources';

type Props = {
    projectId: number;
    open: boolean;
    link: ProjectLink | null;
    onOpenChange: (open: boolean) => void;
};

const blank = { title: '', url: '', category: '', notes: '', pinned: true };

export function ProjectLinkDialog({ projectId, open, link, onOpenChange }: Props) {
    const [form, setForm] = useState(blank);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) return;
        setForm(link ? {
            title: link.title, url: link.url, category: link.category || '',
            notes: link.notes || '', pinned: link.pinned,
        } : blank);
        setErrors({});
    }, [link, open]);

    const base = '/projects/' + projectId + '/links';
    const submit = () => {
        if (!form.title.trim() || !form.url.trim()) {
            setErrors({ title: 'Name and URL are required.' });
            return;
        }
        setBusy(true);
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors: Record<string, string>) => setErrors(errors),
            onFinish: () => setBusy(false),
        };
        if (link) router.patch(base + '/' + link.id, form, options);
        else router.post(base, form, options);
    };
    const remove = () => {
        if (!link || !window.confirm('Delete this link?')) return;
        router.delete(base + '/' + link.id, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader><DialogTitle>{link ? 'Edit link' : 'Add link'}</DialogTitle></DialogHeader>
            <div className="grid gap-4">
                <label className="grid gap-2 text-xs">Display name<input className={fieldClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                <label className="grid gap-2 text-xs">URL<input className={fieldClass} type="url" placeholder="https://docs.google.com/..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
                <label className="grid gap-2 text-xs">Category<input className={fieldClass} placeholder="Planning, Design, Content…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
                <label className="grid gap-2 text-xs">Notes<textarea className={fieldClass + ' min-h-24 resize-y'} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to Main</label>
                <p className="text-[11px] text-muted-foreground">Google Docs, Sheets, Slides, Drive and Figma are identified automatically from the URL.</p>
                {Object.values(errors).length > 0 && <p role="alert" className="text-xs text-red-600">{Object.values(errors)[0]}</p>}
                <div className="flex items-center justify-end gap-2">
                    {link && <button type="button" className={mutedButton + ' mr-auto text-red-600'} onClick={remove}><Trash2 className="size-4" /> Delete</button>}
                    <button type="button" className={outlineButton} onClick={() => onOpenChange(false)}>Cancel</button>
                    <button type="button" className={solidButton} disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Save link'}</button>
                </div>
            </div>
        </DialogContent>
    </Dialog>;
}
