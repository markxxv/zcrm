import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, ArrowUpRight, Pin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Filters, Page, ProjectLink } from '@/types/project';
import { ServiceIcon, SectionHeader, Paginator, ResourceSearch, FilterSelect, fieldClass, mutedButton, solidButton, outlineButton, domain, displayDate, useResourceFilters } from './resources';

type Props = { projectId: number; page: Page<ProjectLink> | null; filters: Filters };
const blank = { title: '', url: '', category: '', notes: '', pinned: false };

export function ProjectLinks({ projectId, page, filters }: Props) {
    const { query, setQuery, setFilter } = useResourceFilters(projectId, filters);
    const [opened, setOpened] = useState(false);
    const [active, setActive] = useState<ProjectLink | null>(null);
    const [form, setForm] = useState(blank);
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    useEffect(() => { setOpened(false); }, [projectId]);

    const open = (link: ProjectLink | null) => {
        setActive(link); setForm(link ? { title: link.title, url: link.url, category: link.category || '', notes: link.notes || '', pinned: link.pinned } : blank);
        setErrors({}); setOpened(true);
    };
    const url = '/projects/' + projectId + '/links';
    const submit = () => {
        if (!form.title.trim() || !form.url.trim()) { setErrors({ title: 'Name and URL are required' }); return; }
        setBusy(true);
        const opts = { preserveScroll: true, onSuccess: () => setOpened(false), onError: (e: Record<string, string>) => setErrors(e), onFinish: () => setBusy(false) };
        if (active) router.patch(url + '/' + active.id, form, opts);
        else router.post(url, form, opts);
    };
    const remove = () => {
        if (!active || !window.confirm('Delete this link?')) return;
        router.delete(url + '/' + active.id, { preserveScroll: true, onSuccess: () => setOpened(false) });
    };
    return <>
        <SectionHeader title="Project links" subtitle="Documents, shared folders and external resources" action={<button className={solidButton} onClick={() => open(null)}><Plus className="size-4" /> Add link</button>} />
        <div className="mb-6 flex flex-wrap gap-2">
            <ResourceSearch query={query} setQuery={setQuery} placeholder="Search by name, URL, category or notes" />
            <FilterSelect value={filters.type} onChange={(type) => setFilter({ type })} options={[
                { value: 'all', label: 'All types' }, { value: 'docs', label: 'Google Docs' }, { value: 'sheets', label: 'Google Sheets' }, { value: 'slides', label: 'Google Slides' }, { value: 'drive', label: 'Google Drive' }, { value: 'figma', label: 'Figma' }, { value: 'web', label: 'Other' },
            ]} />
            <FilterSelect value={filters.sort} onChange={(sort) => setFilter({ sort })} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }]} />
        </div>
        {(page?.data || []).length ? <div className="divide-y divide-border/40">
            {page?.data.map((link) => <div key={link.id} className="group flex min-w-0 items-center gap-3 py-3.5">
                <ServiceIcon kind={link.kind} />
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 truncate text-xs font-semibold hover:text-blue-600">{link.title} {link.pinned && <Pin className="size-3 shrink-0 text-muted-foreground" />}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{domain(link.url)} · {link.category || 'General'}</span>
                </a>
                <span className="hidden text-[11px] text-muted-foreground sm:block">{displayDate(link.created_at)}</span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={mutedButton} aria-label="Open link"><ArrowUpRight className="size-4" /></a>
                <button className={mutedButton} onClick={() => open(link)} aria-label={'Edit ' + link.title}><Pencil className="size-4" /></button>
            </div>)}
        </div> : <div className="py-24 text-center text-xs text-muted-foreground">No links found.</div>}
        <Paginator page={page} />
        <Dialog open={opened} onOpenChange={setOpened}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader><DialogTitle>{active ? 'Edit link' : 'Add link'}</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                    <label className="grid gap-2 text-xs">Display name<input className={fieldClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
                    <label className="grid gap-2 text-xs">URL<input className={fieldClass} type="url" placeholder="https://docs.google.com/..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
                    <label className="grid gap-2 text-xs">Category<input className={fieldClass} placeholder="Planning, Design, Content…" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
                    <label className="grid gap-2 text-xs">Notes<textarea className={fieldClass + ' min-h-24 resize-y'} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to Main</label>
                    <p className="text-[11px] text-muted-foreground">Google Docs, Sheets, Slides, Drive and Figma are identified automatically by URL.</p>
                    {Object.values(errors).length > 0 && <p role="alert" className="text-xs text-red-600">{Object.values(errors)[0]}</p>}
                    <div className="flex items-center justify-end gap-2">
                        {active && <button className={mutedButton + ' mr-auto text-red-600'} onClick={remove}><Trash2 className="size-4" /> Delete</button>}
                        <button className={outlineButton} onClick={() => setOpened(false)}>Cancel</button>
                        <button className={solidButton} disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Save link'}</button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </>;
}
