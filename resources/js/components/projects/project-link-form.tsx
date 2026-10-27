import { useEffect, useState, type KeyboardEvent } from 'react';
import { router } from '@inertiajs/react';
import { AlignLeft, ChevronDown, ChevronUp, Link2, Pin, Trash2, Type } from 'lucide-react';
import type { ProjectLink } from '@/types/project';
import { outlineButton, solidButton } from './resources';
import { ProjectFormField, projectFieldInput } from './project-form-field';
import { ProjectChipsInput } from './project-chips-input';

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
    suggestions?: string[];
    onClose: () => void;
};

const blank: FormState = { title: '', url: '', category: '', notes: '', pinned: true };

function initialState(link?: ProjectLink | null): FormState {
    return link ? {
        title: link.title,
        url: link.url,
        category: link.category || '',
        notes: link.notes || '',
        pinned: link.pinned,
    } : blank;
}

/** Reused by the Main popover, mobile drawer and the full Links editor. */
export function ProjectLinkForm({ projectId, link, compact = false, suggestions = [], onClose }: Props) {
    const [data, setData] = useState<FormState>(() => initialState(link));
    const [categoryDraft, setCategoryDraft] = useState('');
    const [expanded, setExpanded] = useState(!compact);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setData(initialState(link));
        setCategoryDraft('');
        setExpanded(!compact);
        setConfirmDelete(false);
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
        const category = categoryDraft.trim() || data.category.trim();
        const nextErrors: Record<string, string> = {};
        if (!data.title.trim()) nextErrors.title = 'Enter a name for this link.';
        if (!data.url.trim()) nextErrors.url = 'Enter the URL.';
        else {
            try {
                const parsed = new URL(data.url.trim());
                if (!['http:', 'https:'].includes(parsed.protocol)) nextErrors.url = 'Use an HTTP or HTTPS URL.';
            } catch { nextErrors.url = 'Enter a valid URL starting with https://.'; }
        }
        if (category.length > 80) nextErrors.category = 'Maximum 80 characters.';
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            if (nextErrors.category) setExpanded(true);
            return;
        }

        setSaving(true);
        const payload = {
            title: data.title.trim(),
            url: data.url.trim(),
            category,
            notes: data.notes.trim(),
            pinned: data.pinned,
        };
        const options = {
            preserveScroll: true,
            onSuccess: onClose,
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

    const destroy = () => {
        if (!link || saving) return;
        setSaving(true);
        router.delete('/projects/' + projectId + '/links/' + link.id, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: (issues) => setErrors(issues),
            onFinish: () => setSaving(false),
        });
    };

    const enterToSave = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit();
        }
    };

    return <div className="space-y-3">
        <ProjectFormField id="project-link-title" title="Name" icon={Type} error={errors.title}>
            <input id="project-link-title" autoFocus autoComplete="off" className={projectFieldInput}
                placeholder="Link name" maxLength={255} value={data.title} disabled={saving}
                onChange={(e) => set('title', e.target.value)} onKeyDown={enterToSave} />
        </ProjectFormField>

        <ProjectFormField id="project-link-url" title="URL" icon={Link2} error={errors.url}>
            <input id="project-link-url" type="url" inputMode="url" autoComplete="url"
                className={projectFieldInput} placeholder="https://docs.google.com/..."
                value={data.url} disabled={saving} onChange={(e) => set('url', e.target.value)}
                onKeyDown={enterToSave} />
        </ProjectFormField>

        {compact && <button type="button" onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded} className="flex items-center gap-1.5 px-1 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            {expanded ? 'Fewer options' : 'Category & notes'}
        </button>}

        {expanded && <div className="space-y-3">
            <ProjectChipsInput id="project-link-category" label="Category · optional"
                multiple={false} maxLength={80}
                values={data.category ? [data.category] : []}
                onChange={(values) => set('category', values[0] || '')}
                draft={categoryDraft} onDraftChange={setCategoryDraft}
                suggestions={suggestions} placeholder="Choose or create category"
                disabled={saving} error={errors.category} />

            <ProjectFormField id="project-link-notes" title="Notes · optional" icon={AlignLeft}
                multiline error={errors.notes}>
                <textarea id="project-link-notes" rows={2} maxLength={4000}
                    className={projectFieldInput + ' min-h-14 resize-y'}
                    placeholder="Any helpful context…" value={data.notes} disabled={saving}
                    onChange={(e) => set('notes', e.target.value)} />
            </ProjectFormField>
        </div>}

        <div className="flex items-center justify-between gap-2 px-1 py-1">
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
                <input type="checkbox" className="size-3.5 accent-foreground"
                    checked={data.pinned} disabled={saving}
                    onChange={(e) => set('pinned', e.target.checked)} />
                <Pin className="size-3.5" aria-hidden /> Pin to Main
            </label>
        </div>

        {errors.general && <p role="alert" className="text-[11px] text-red-500">{errors.general}</p>}
        {confirmDelete && link && <div className="space-y-2 rounded-lg bg-red-500/5 px-3 py-3">
            <p className="text-xs font-medium text-red-500">Delete this link permanently?</p>
            <div className="flex justify-end gap-2">
                <button type="button" disabled={saving} className={outlineButton} onClick={() => setConfirmDelete(false)}>Keep link</button>
                <button type="button" disabled={saving} onClick={destroy}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                    {saving ? 'Deleting…' : 'Delete permanently'}
                </button>
            </div>
        </div>}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {link && !confirmDelete && <button type="button" disabled={saving}
                onClick={() => setConfirmDelete(true)}
                className="mr-auto inline-flex items-center gap-1.5 px-2 py-2 text-xs text-red-500 hover:text-red-600">
                <Trash2 className="size-3.5" /> Delete
            </button>}
            <button type="button" disabled={saving} className={outlineButton} onClick={onClose}>Cancel</button>
            <button type="button" disabled={saving || confirmDelete} className={solidButton} onClick={submit}>
                {saving ? 'Saving…' : link ? 'Save changes' : 'Add link'}
            </button>
        </div>
    </div>;
}
