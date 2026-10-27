import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { AlignLeft, ChevronDown, Database, Eye, EyeOff, Globe2, HardDrive, KeyRound, Layers3, Pencil, Plus, Server, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import type { Filters, Page, ProjectAccess } from '@/types/project';
import { SectionHeader, Paginator, ResourceSearch, FilterSelect, mutedButton, outlineButton, solidButton, useResourceFilters } from './resources';
import { ProjectFormField, projectFieldInput } from './project-form-field';
import { ProjectResponsiveDialog } from './project-responsive-dialog';
import { ProjectCredentialViewer } from './project-credential-viewer';

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
    const [showSecret, setShowSecret] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [revealing, setRevealing] = useState<ProjectAccess | null>(null);
    const [revealed, setRevealed] = useState<string | null>(null);
    const [revealNotes, setRevealNotes] = useState<string | null>(null);
    const revealSequence = useRef(0);
    const [revealError, setRevealError] = useState('');
    const base = '/projects/' + projectId + '/access';

    useEffect(() => { setOpened(false); hideReveal(); }, [projectId]);
    const closeEditor = () => {
        setOpened(false); setActive(null); setForm(blank); setErrors({});
        setShowSecret(false); setConfirmDelete(false);
    };
    const changeField = (key: keyof SecretForm, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => {
            if (!current[key]) return current;
            const next = { ...current };
            delete next[key];
            return next;
        });
    };
    function hideReveal() { revealSequence.current++; setRevealing(null); setRevealed(null); setRevealNotes(null); setRevealError(''); }

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
        setErrors({}); setNotesLoaded(!access); setShowSecret(false); setConfirmDelete(false); setOpened(true);
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
        const sequence = ++revealSequence.current;
        setRevealing(access);
        setRevealed(null);
        setRevealNotes(null);
        setRevealError('');
        try {
            const data = await loadSecret(access);
            if (sequence === revealSequence.current) {
                setRevealed(data.secret);
                setRevealNotes(data.notes);
            }
        } catch (error) {
            if (sequence === revealSequence.current) {
                setRevealError(error instanceof Error ? error.message : 'Unable to reveal credential');
            }
        }
    };
    const save = () => {
        if (!notesLoaded) { setErrors({ notes: 'Encrypted notes are unavailable. Reopen this entry.' }); return; }
        const nextErrors: Record<string, string> = {};
        if (!form.name.trim()) nextErrors.name = 'Enter a service name.';
        if (!active && !form.secret.trim()) nextErrors.secret = 'Enter a password or API key.';
        if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
        setBusy(true);
        const payload = { ...form, category: form.category as ProjectAccess['category'] };
        const options = {
            preserveScroll: true,
            onSuccess: closeEditor,
            onError: (issues: Record<string, string>) => setErrors(issues),
            onFinish: () => setBusy(false),
        };
        if (active) router.patch(base + '/' + active.id, payload, options);
        else router.post(base, payload, options);
    };
    const remove = () => {
        if (!active || busy) return;
        setBusy(true);
        router.delete(base + '/' + active.id, {
            preserveScroll: true,
            onSuccess: closeEditor,
            onError: (issues) => setErrors(issues),
            onFinish: () => setBusy(false),
        });
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
        <ProjectResponsiveDialog open={opened} onOpenChange={(next) => { if (!next) closeEditor(); }}
            title={active ? 'Edit access' : 'Add access'}
            description="Encrypted credentials · Project owner only"
            icon={ShieldCheck} disabled={busy}>
            <div className="space-y-3">
                <ProjectFormField id="access-name" title="Service name" icon={Server} error={errors.name}>
                    <input id="access-name" autoFocus autoComplete="off" maxLength={150} disabled={busy}
                        className={projectFieldInput} placeholder="Hosting, database, service…"
                        value={form.name} onChange={(e) => changeField('name', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} />
                </ProjectFormField>

                <ProjectFormField id="access-category" title="Type" icon={Layers3} error={errors.category}>
                    <select id="access-category" className={projectFieldInput + ' cursor-pointer appearance-none'}
                        disabled={busy} value={form.category} onChange={(e) => changeField('category', e.target.value)}>
                        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </ProjectFormField>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ProjectFormField id="access-host" title="Host / URL · optional" icon={Globe2} error={errors.host}>
                        <input id="access-host" autoComplete="off" maxLength={255} disabled={busy}
                            className={projectFieldInput} placeholder="server.example.com"
                            value={form.host} onChange={(e) => changeField('host', e.target.value)} />
                    </ProjectFormField>
                    <ProjectFormField id="access-username" title="Username · optional" icon={UserRound} error={errors.username}>
                        <input id="access-username" autoComplete="off" maxLength={255} disabled={busy}
                            className={projectFieldInput} placeholder="root / admin"
                            value={form.username} onChange={(e) => changeField('username', e.target.value)} />
                    </ProjectFormField>
                </div>

                <ProjectFormField id="access-secret" title={active ? 'New password · leave blank to keep existing' : 'Password / API key'} icon={KeyRound}
                    error={errors.secret}>
                    <input id="access-secret" type={showSecret ? 'text' : 'password'} autoComplete="new-password"
                        maxLength={10000} disabled={busy} className={projectFieldInput}
                        placeholder={active ? 'Keep current secret' : 'Enter password or API key'}
                        value={form.secret} onChange={(e) => changeField('secret', e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} />
                    <button type="button" disabled={busy} aria-label={showSecret ? 'Hide password' : 'Show password'}
                        aria-pressed={showSecret} className="shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowSecret((value) => !value)}>
                        {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </ProjectFormField>

                <ProjectFormField id="access-notes" title="Private notes · optional" icon={AlignLeft}
                    error={errors.notes} multiline>
                    <textarea id="access-notes" rows={2} maxLength={10000} disabled={busy || !notesLoaded}
                        className={projectFieldInput + ' min-h-14 resize-y'}
                        placeholder={notesLoaded ? 'Additional private details…' : 'Loading encrypted notes…'}
                        value={form.notes} onChange={(e) => changeField('notes', e.target.value)} />
                </ProjectFormField>

                {errors.general && <p role="alert" className="text-[11px] text-red-500">{errors.general}</p>}
                {confirmDelete && active && <div className="space-y-2 rounded-lg bg-red-500/5 px-3 py-3">
                    <p className="text-xs font-medium text-red-500">Delete these credentials permanently?</p>
                    <p className="text-[11px] text-muted-foreground">The saved password and private notes will be removed.</p>
                    <div className="flex justify-end gap-2">
                        <button type="button" disabled={busy} className={outlineButton} onClick={() => setConfirmDelete(false)}>Keep access</button>
                        <button type="button" disabled={busy} onClick={remove}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                            {busy ? 'Deleting…' : 'Delete permanently'}
                        </button>
                    </div>
                </div>}

                <div className="flex flex-wrap items-center justify-end gap-2 pt-3">
                    {active && !confirmDelete && <button type="button" disabled={busy} className="mr-auto inline-flex items-center gap-1.5 px-2 py-2 text-xs text-red-500 hover:text-red-600"
                        onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="size-3.5" /> Delete
                    </button>}
                    <button type="button" disabled={busy} className={outlineButton} onClick={closeEditor}>Cancel</button>
                    <button type="button" disabled={busy || !notesLoaded || confirmDelete} className={solidButton} onClick={save}>
                        {busy ? 'Saving…' : active ? 'Save changes' : 'Add access'}
                    </button>
                </div>
            </div>
        </ProjectResponsiveDialog>
        <ProjectCredentialViewer access={revealing} secret={revealed}
            notes={revealNotes} error={revealError} onClose={hideReveal} />
    </>;
}
