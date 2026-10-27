import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Database, Eye, EyeOff, Globe2, HardDrive, KeyRound, Pencil, Plus, ShieldCheck, Trash2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Filters, Page, ProjectAccess } from '@/types/project';
import { SectionHeader, Paginator, ResourceSearch, FilterSelect, fieldClass, mutedButton, outlineButton, solidButton, useResourceFilters } from './resources';

type Props = { projectId: number; page: Page<ProjectAccess> | null; filters: Filters; canAccessVault: boolean };
type SecretForm = { name: string; category: string; host: string; username: string; secret: string; notes: string };
const blank: SecretForm = { name: '', category: 'Hosting', host: '', username: '', secret: '', notes: '' };
const categories = ['Hosting', 'Database', 'DNS', 'Other'];

function xsrfToken() {
    const cookie = document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='));
    return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : '';
}

export function ProjectAccessTab({ projectId, page, filters, canAccessVault }: Props) {
    const { query, setQuery, setFilter } = useResourceFilters(projectId, filters);
    const [opened, setOpened] = useState(false);
    const [active, setActive] = useState<ProjectAccess | null>(null);
    const [form, setForm] = useState<SecretForm>(blank);
    const [busy, setBusy] = useState(false);
    const [notesLoaded, setNotesLoaded] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [revealing, setRevealing] = useState<ProjectAccess | null>(null);
    const [revealed, setRevealed] = useState<string | null>(null);
    const [revealNotes, setRevealNotes] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [revealError, setRevealError] = useState('');
    const base = '/projects/' + projectId + '/access';

    useEffect(() => { setOpened(false); setRevealing(null); setRevealed(null); }, [projectId]);
    function hideReveal() { setRevealing(null); setRevealed(null); setRevealNotes(null); setVisible(false); setRevealError(''); }

    async function loadSecret(access: ProjectAccess): Promise<{ secret: string; notes: string | null }> {
        const res = await fetch(base + '/' + access.id + '/reveal', {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Accept': 'application/json', 'X-XSRF-TOKEN': xsrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
        });
        if (!res.ok) throw Error(res.status === 429 ? 'Too many requests. Try later.' : 'Unable to access this credential.');
        return res.json();
    }
    const open = async (access: ProjectAccess | null) => {
        setActive(access);
        setForm(access ? { name: access.name, category: access.category, host: access.host || '', username: access.username || '', secret: '', notes: '' } : blank);
        setErrors({}); setNotesLoaded(!access); setOpened(true);
        if (access) {
            try {
                const data = await loadSecret(access);
                setForm((current) => ({ ...current, notes: data.notes || '' }));
                setNotesLoaded(true);
            } catch {
                setErrors({ notes: 'Cannot load encrypted notes. Reopen this entry before saving.' });
            }
        }
    };
    const reveal = async (access: ProjectAccess) => {
        setRevealing(access); setRevealed(null); setRevealNotes(null); setRevealError(''); setVisible(false);
        try {
            const data = await loadSecret(access);
            setRevealed(data.secret); setRevealNotes(data.notes);
        } catch (error) { setRevealError(error instanceof Error ? error.message : 'Unable to reveal credential'); }
    };
    const save = () => {
        if (!notesLoaded) { setErrors({ notes: 'Encrypted notes are unavailable. Reopen this entry.' }); return; }
        if (!form.name.trim() || (!active && !form.secret)) { setErrors({ name: 'Name and password are required' }); return; }
        setBusy(true);
        const payload = { ...form, category: form.category as ProjectAccess['category'] };
        const options = { preserveScroll: true, onSuccess: () => { setOpened(false); setForm(blank); }, onError: (e: Record<string, string>) => setErrors(e), onFinish: () => setBusy(false) };
        if (active) router.patch(base + '/' + active.id, payload, options);
        else router.post(base, payload, options);
    };
    const remove = () => {
        if (!active || !window.confirm('Permanently delete these credentials?')) return;
        router.delete(base + '/' + active.id, { preserveScroll: true, onSuccess: () => { setOpened(false); setForm(blank); } });
    };

    if (!canAccessVault) return <>
        <SectionHeader title="Access & credentials" subtitle="Passwords, hosting, databases and services" />
        <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-6">
            <ShieldCheck className="size-6 shrink-0 text-muted-foreground" />
            <div><p className="text-sm font-semibold">Restricted section</p><p className="mt-1 text-xs text-muted-foreground">Only the project owner can manage and reveal stored credentials.</p></div>
        </div>
    </>;

    return <>
        <SectionHeader title="Access & credentials" subtitle="Encrypted credentials for infrastructure and services" action={<button className={solidButton} onClick={() => open(null)}><Plus className="size-4" /> Add access</button>} />
        <div className="mb-7 flex items-start gap-3 rounded-xl bg-muted/35 p-4"><ShieldCheck className="size-5 shrink-0 text-muted-foreground" /><div><p className="text-xs font-semibold">Private credentials vault</p><p className="mt-1 text-[11px] text-muted-foreground">Passwords and notes are encrypted at rest. Only the project owner can reveal them. Access events are recorded.</p></div></div>
        <div className="mb-4 flex flex-wrap gap-2">
            <ResourceSearch query={query} setQuery={setQuery} placeholder="Search service, host or username" />
            <FilterSelect value={filters.type} onChange={(type) => setFilter({ type })} options={[{ value: 'all', label: 'All services' }, ...categories.map((category) => ({ value: category, label: category }))]} />
        </div>
        {(page?.data || []).length ? <div className="divide-y divide-border/40">
            {page?.data.map((access) => <div key={access.id} className="flex min-w-0 items-center gap-3 py-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted/60">
                    {access.category === 'Hosting' ? <HardDrive className="size-5 text-muted-foreground" /> : access.category === 'Database' ? <Database className="size-5 text-muted-foreground" /> : access.category === 'DNS' ? <Globe2 className="size-5 text-muted-foreground" /> : <KeyRound className="size-5 text-muted-foreground" />}
                </span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{access.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{access.host || access.category} · {access.username || 'No username'}</p></div>
                <span className="hidden text-xs tracking-widest text-muted-foreground sm:inline">••••••••</span>
                <button className={mutedButton} onClick={() => reveal(access)} title="Reveal"><Eye className="size-4" /></button>
                <button className={mutedButton} onClick={() => open(access)} title="Edit"><Pencil className="size-4" /></button>
            </div>)}
        </div> : <div className="py-24 text-center text-xs text-muted-foreground">No credentials found.</div>}
        <Paginator page={page} />
        <Dialog open={opened} onOpenChange={(next) => { if (!next) { setOpened(false); setForm(blank); } }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{active ? 'Edit access' : 'Add access'}</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                    <label className="grid gap-2 text-xs">Service name<input className={fieldClass} autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
                    <label className="grid gap-2 text-xs">Type<select className={fieldClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                    <label className="grid gap-2 text-xs">Host / URL<input className={fieldClass} value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} autoComplete="off" /></label>
                    <label className="grid gap-2 text-xs">Username<input className={fieldClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" /></label>
                    <label className="grid gap-2 text-xs">{active ? 'New password (leave blank to keep existing)' : 'Password / API key'}<input className={fieldClass} type="password" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} autoComplete="new-password" /></label>
                    <label className="grid gap-2 text-xs">Private notes<textarea className={fieldClass + ' min-h-20 resize-y'} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                    {Object.values(errors).length > 0 && <p role="alert" className="text-xs text-red-600">{Object.values(errors)[0]}</p>}
                    <div className="flex items-center justify-end gap-2">
                        {active && <button className={mutedButton + ' mr-auto text-red-600'} onClick={remove}><Trash2 className="size-4" /> Delete</button>}
                        <button className={outlineButton} onClick={() => { setOpened(false); setForm(blank); }}>Cancel</button>
                        <button className={solidButton} disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save access'}</button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={!!revealing} onOpenChange={(next) => { if (!next) hideReveal(); }}>
            <DialogContent>
                <DialogHeader><DialogTitle>Credential · {revealing?.name}</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground">{revealing?.host}</p>
                {revealError && <p role="alert" className="text-xs text-red-600">{revealError}</p>}
                {revealed !== null ? <div className="grid gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3">
                        <span className="min-w-0 flex-1 break-all font-mono text-xs">{visible ? revealed : '•'.repeat(Math.min(Math.max(revealed.length, 8), 32))}</span>
                        <button className={mutedButton} onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
                        <button className={mutedButton} onClick={() => navigator.clipboard.writeText(revealed)} aria-label="Copy password"><Copy className="size-4" /></button>
                    </div>
                    {revealNotes && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{revealNotes}</p>}
                    <p className="text-[11px] text-muted-foreground">This access is logged. Close this window to clear the value from the screen.</p>
                </div> : !revealError && <p className="text-xs text-muted-foreground">Decrypting…</p>}
            </DialogContent>
        </Dialog>
    </>;
}
