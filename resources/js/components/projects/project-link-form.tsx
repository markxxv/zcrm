import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { AlignLeft, ChevronDown, ChevronUp, Link2, Pin, Tag, Trash2, Type } from 'lucide-react';
import type { ProjectLink } from '@/types/project';
import { mutedButton, outlineButton, solidButton } from './resources';

type FormState = {
    title: string;
    url: string;
    category: string;
    notes: string;
    pinned: boolean;
};

type Props = {
    projectId: number;
    link?: ProjectLink | null;
    compact?: boolean;
    onClose: () => void;
};

const blank: FormState = { title: '', url: '', category: '', notes: '', pinned: true };
const field = 'w-full min-w-0 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/65';
const inputWrap = 'flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5 focus-within:bg-muted/80';
const iconClass = 'size-4 shrink-0 text-muted-foreground/75';

function initialState(link?: ProjectLink | null): FormState {
    return link ? {
        title: link.title,
        url: link.url,
        category: link.category || '',
        notes: link.notes || '',
        pinned: link.pinned,
    } : blank;
}

/** Shared link editor: Main's compact popover/drawer and Links' full dialog. */
export function ProjectLinkForm({ projectId, link, compact = false, onClose }: Props) {
    const [data, setData] = useState<FormState>(() => initialState(link));
    const [expanded, setExpanded] = useState(!compact);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setData(initialState(link));
        setExpanded(!compact);
        setErrors({});
    }, [link, compact, projectId]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setData((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
    };

    const submit = () => {
        if (saving) return;
        const nextErrors: Record<string, string> = {};
        if (!data.title.trim()) nextErrors.title = 'Enter a name for the link.';
        if (!data.url.trim()) nextErrors.url = 'Enter the URL.';
        else {
            try {
                const parsed = new URL(data.url.trim());
                if (!['https:', 'http:'].includes(parsed.protocol)) nextErrors.url = 'Use an HTTP or HTTPS URL.';
            } catch { nextErrors.url = 'Enter a valid URL, including https://.'; }
        }
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        setSaving(true);
        const payload = {
            title: data.title.trim(),
            url: data.url.trim(),
            category: data.category.trim(),
            notes: data.notes.trim(),
            pinned: data.pinned,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (issues: Record<string, string>) => {
                setErrors(issues);
                if (issues.category || issues.notes) setExpanded(true);
            },
            onFinish: () => setSaving(false),
        };
        const base = '/projects/' + projectId + '/links';
        if (link) router.patch(base + '/' + link.id, payload, options);
        else router.post(base, payload, options);
    };

    const remove = () => {
        if (!link || saving || !window.confirm('Delete this link?')) return;
        setSaving(true);
        router.delete('/projects/' + projectId + '/links/' + link.id, {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setSaving(false),
        });
    };

    const enterToSave = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit();
        }
    };

    return <div className="space-y-2.5">
        <label className={inputWrap}>
            <Type className={iconClass} aria-hidden />
            <span className="sr-only">Link name</span>
            <input autoFocus autoComplete="off" className={field} placeholder="Name" value={data.title}
                maxLength={255} disabled={saving} onChange={(e) => set('title', e.target.value)}
                onKeyDown={enterToSave} aria-invalid={Boolean(errors.title)} />
        </label>
        {errors.title && <p role="alert" className="pl-1 text-[11px] text-red-500">{errors.title}</p>}

        <label className={inputWrap}>
            <Link2 className={iconClass} aria-hidden />
            <span className="sr-only">Link URL</span>
            <input type="url" inputMode="url" autoComplete="url" className={field}
                placeholder="https://docs.google.com/..." value={data.url}
                disabled={saving} onChange={(e) => set('url', e.target.value)} onKeyDown={enterToSave}
                aria-invalid={Boolean(errors.url)} />
        </label>
        {errors.url && <p role="alert" className="pl-1 text-[11px] text-red-500">{errors.url}</p>}

        {compact && <button type="button" onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="flex items-center gap-1.5 px-1 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? 'Fewer options' : 'Category & notes'}
        </button>}

        {expanded && <div className="space-y-2.5">
            <label className={inputWrap}>
                <Tag className={iconClass} aria-hidden />
                <span className="sr-only">Category</span>
                <input className={field} maxLength={80} placeholder="Category · optional"
                    disabled={saving} value={data.category} onChange={(e) => set('category', e.target.value)}
                    onKeyDown={enterToSave} />
            </label>
            {errors.category && <p role="alert" className="pl-1 text-[11px] text-red-500">{errors.category}</p>}
            <label className={inputWrap + ' items-start'}>
                <AlignLeft className={iconClass + ' mt-0.5'} aria-hidden />
                <span className="sr-only">Notes</span>
                <textarea className={field + ' min-h-12 resize-y'} rows={2} maxLength={4000}
                    placeholder="Notes · optional" value={data.notes}
                    disabled={saving} onChange={(e) => set('notes', e.target.value)} />
            </label>
            {errors.notes && <p role="alert" className="pl-1 text-[11px] text-red-500">{errors.notes}</p>}
        </div>}

        <div className="flex items-center justify-between gap-3 px-1 py-1">
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
                <input type="checkbox" className="size-3.5 accent-foreground" checked={data.pinned}
                    disabled={saving} onChange={(e) => set('pinned', e.target.checked)} />
                <Pin className="size-3.5" aria-hidden />
                Pin to Main
            </label>
            <span className="text-[10px] text-muted-foreground/70">Google links detected automatically</span>
        </div>

        {errors.general && <p role="alert" className="text-[11px] text-red-500">{errors.general}</p>}
        <div className="flex items-center justify-end gap-2 pt-1">
            {link && <button type="button" disabled={saving} onClick={remove}
                className={mutedButton + ' mr-auto text-red-500'}><Trash2 className="size-4" /> Delete</button>}
            <button type="button" disabled={saving} className={outlineButton} onClick={onClose}>Cancel</button>
            <button type="button" disabled={saving} className={solidButton} onClick={submit}>
                {saving ? 'Saving…' : link ? 'Save changes' : 'Add link'}
            </button>
        </div>
    </div>;
}
