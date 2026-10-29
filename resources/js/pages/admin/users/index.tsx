import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Check, ChevronLeft, ChevronRight, Copy, Eye, EyeOff, KeyRound, LockKeyhole,
    Mail, MoreHorizontal, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRound, Users, X,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { ProjectFormField, projectFieldInput } from '@/components/projects/project-form-field';
import { ProjectResponsiveDialog } from '@/components/projects/project-responsive-dialog';
import { UserAvatar } from '@/components/user-avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Account = {
    id: number; name: string; email: string; avatar: string | null;
    projects_count: number; project_ids: number[]; created_at: string | null;
};
type Project = { id: number; name: string; created_by: number };
type Page = {
    data: Account[]; current_page: number; last_page: number; total: number;
    prev_page_url: string | null; next_page_url: string | null;
};
type DialogMode = 'create' | 'edit' | 'password' | 'delete';
type Selection = { mode: DialogMode; user: Account | null };

const solid = 'inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-3.5 py-2.5 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40';
const muted = 'inline-flex items-center justify-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs font-medium hover:bg-muted disabled:opacity-40';
const quiet = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40';

function secureIndex(length: number): number {
    const buffer = new Uint32Array(1);
    const limit = Math.floor(4294967296 / length) * length;
    do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
    return buffer[0] % length;
}

function generatePassword(): string {
    const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghjkmnpqrstuvwxyz', '23456789', '!@#$%&*_-+=?'];
    const combined = groups.join('');
    const chars = [...groups.map((group) => group[secureIndex(group.length)])];
    while (chars.length < 20) chars.push(combined[secureIndex(combined.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
        const j = secureIndex(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}

function UserDialog({ selection, projects, onClose }: {
    selection: Selection; projects: Project[]; onClose: () => void;
}) {
    const { mode, user } = selection;
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [password, setPassword] = useState(() => mode === 'create' || mode === 'password' ? generatePassword() : '');
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [projectIds, setProjectIds] = useState<number[]>(user?.project_ids ?? []);
    const [projectSearch, setProjectSearch] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);

    const userLabel = user?.name ?? 'New user';
    const title = mode === 'create' ? 'New user' : mode === 'edit' ? 'Edit user' : mode === 'password' ? 'Reset password' : 'Delete user';
    const description = mode === 'create' ? 'Create an account and assign projects' :
        mode === 'edit' ? 'Profile details and project access' :
        mode === 'password' ? 'Issue a new password for ' + userLabel :
        'This operation permanently removes the account';
    const Icon = mode === 'password' ? KeyRound : mode === 'delete' ? Trash2 : UserRound;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
            setErrors((current) => ({ ...current, clipboard: '' }));
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setErrors((current) => ({ ...current, clipboard: 'Clipboard unavailable. Select the visible password to copy it.' }));
            setVisible(true);
        }
    };

    const submit = () => {
        if (busy) return;
        if (saved) { onClose(); return; }
        setBusy(true);
        setErrors({});
        const options = {
            preserveScroll: true,
            onError: (issues: Record<string, string>) => setErrors(issues),
            onFinish: () => setBusy(false),
        };
        if (mode === 'create') {
            router.post('/admin/users', { name: name.trim(), email: email.trim(), password, project_ids: projectIds }, {
                ...options, onSuccess: () => setSaved(true),
            });
        } else if (mode === 'edit' && user) {
            router.patch('/admin/users/' + user.id, { name: name.trim(), email: email.trim(), project_ids: projectIds }, {
                ...options, onSuccess: onClose,
            });
        } else if (mode === 'password' && user) {
            router.patch('/admin/users/' + user.id + '/password', { password }, {
                ...options, onSuccess: () => setSaved(true),
            });
        } else if (mode === 'delete' && user) {
            router.delete('/admin/users/' + user.id, { ...options, onSuccess: onClose });
        }
    };

    const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(projectSearch.toLowerCase()));
    const withProjects = mode === 'create' || mode === 'edit';
    const withPassword = mode === 'create' || mode === 'password';
    const readonly = busy || saved;

    return <ProjectResponsiveDialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}
        title={title} description={description} icon={Icon} disabled={busy}>
        <div className="space-y-4">
            {withProjects && <>
                <ProjectFormField id="admin-user-name" title="Full name" icon={UserRound} error={errors.name}>
                    <input id="admin-user-name" autoFocus autoComplete="off" maxLength={255}
                        disabled={readonly} className={projectFieldInput} placeholder="Name"
                        value={name} onChange={(event) => setName(event.target.value)} />
                </ProjectFormField>
                <ProjectFormField id="admin-user-email" title="Email" icon={Mail} error={errors.email}>
                    <input id="admin-user-email" type="email" autoComplete="off" maxLength={255}
                        disabled={readonly} className={projectFieldInput} placeholder="name@example.com"
                        value={email} onChange={(event) => setEmail(event.target.value)} />
                </ProjectFormField>
            </>}

            {withPassword && <div className="space-y-2">
                {saved && <div className="rounded-lg bg-green-500/10 px-3 py-2.5 text-xs text-green-600 dark:text-green-400">
                    <span className="inline-flex items-center gap-2"><Check className="size-4" /> {mode === 'create' ? 'Account created' : 'Password updated'}</span>
                    <p className="mt-1.5 text-[11px]">Copy the password before closing. It cannot be viewed again.</p>
                </div>}
                <ProjectFormField id="admin-user-password" title={saved ? 'Temporary password · copy now' : 'Password · 20 characters'} icon={LockKeyhole} error={errors.password}>
                    <input id="admin-user-password" autoComplete="new-password" spellCheck={false}
                        className={projectFieldInput + ' font-mono tracking-tight'} value={password}
                        type={visible ? 'text' : 'password'} disabled={readonly}
                        onChange={(event) => setPassword(event.target.value)} />
                    <button type="button" title={visible ? 'Hide password' : 'Show password'}
                        aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((value) => !value)}
                        className="shrink-0 text-muted-foreground hover:text-foreground">
                        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button type="button" title="Copy password" aria-label="Copy password" onClick={copy}
                        className="shrink-0 text-muted-foreground hover:text-foreground">
                        {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                    </button>
                    {!saved && <button type="button" title="Generate password" aria-label="Generate password"
                        disabled={busy} onClick={() => { setPassword(generatePassword()); setCopied(false); }}
                        className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-40">
                        <RefreshCw className="size-4" />
                    </button>}
                </ProjectFormField>
                {errors.clipboard && <p role="alert" className="text-[11px] text-red-500">{errors.clipboard}</p>}
                {!saved && <p className="px-0.5 text-[11px] text-muted-foreground">Uses a cryptographically secure generator. You can also enter a custom password with uppercase, lowercase, numbers and symbols.</p>}
            </div>}

            {withProjects && <div className="rounded-xl bg-muted/25 p-3">
                <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium"><Users className="size-4 text-muted-foreground" /> Project access</span>
                    <span className="text-[11px] text-muted-foreground">{projectIds.length} selected</span>
                </div>
                <label className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                    <Search className="size-3.5 shrink-0 text-muted-foreground" />
                    <input aria-label="Search projects" placeholder="Find a project…" value={projectSearch}
                        onChange={(event) => setProjectSearch(event.target.value)}
                        className={projectFieldInput} autoComplete="off" />
                </label>
                <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto">
                    {filteredProjects.length ? filteredProjects.map((project) => {
                        const owner = user?.id === project.created_by;
                        const checked = projectIds.includes(project.id) || owner;
                        return <label key={project.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs hover:bg-muted/70">
                            <input type="checkbox" className="sr-only" disabled={readonly || owner}
                                checked={checked} onChange={(event) => setProjectIds((current) => event.target.checked
                                    ? [...current, project.id] : current.filter((id) => id !== project.id))} />
                            <span className={'grid size-4 shrink-0 place-items-center rounded text-transparent ' +
                                (checked ? 'bg-foreground text-background' : 'bg-muted')}>
                                <Check className="size-3" />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{project.name}</span>
                            {owner && <span className="text-[10px] text-muted-foreground">Owner</span>}
                        </label>;
                    }) : <p className="py-4 text-center text-[11px] text-muted-foreground">No projects found</p>}
                </div>
                {errors['project_ids'] && <p role="alert" className="mt-2 text-[11px] text-red-500">{errors['project_ids']}</p>}
            </div>}

            {mode === 'password' && <p className="text-[11px] text-muted-foreground">Existing sessions and remembered logins will be revoked. The user can sign in with the new password.</p>}
            {mode === 'delete' && <div className="rounded-xl bg-red-500/5 p-4">
                <p className="text-sm font-medium">{userLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
                <p className="mt-3 text-xs text-red-500">Delete this account permanently? Accounts that own projects or uploaded content are protected from deletion.</p>
            </div>}

            {errors.user && <p role="alert" className="text-xs text-red-500">{errors.user}</p>}
            <div className="flex justify-end gap-2 pt-1">
                <button type="button" disabled={busy} onClick={onClose} className={quiet}>{saved ? 'Close' : 'Cancel'}</button>
                {!saved && <button type="button" disabled={busy || (withProjects && (!name.trim() || !email.trim())) || (withPassword && !password)}
                    onClick={submit} className={mode === 'delete'
                        ? 'inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40'
                        : solid}>
                    {busy ? 'Saving…' : mode === 'create' ? 'Create user' : mode === 'edit' ? 'Save changes' : mode === 'password' ? 'Set new password' : 'Delete permanently'}
                </button>}
            </div>
        </div>
    </ProjectResponsiveDialog>;
}

export default function UsersIndex({ users, projects, filters }: { users: Page; projects: Project[]; filters: { q: string } }) {
    const [search, setSearch] = useState(filters.q);
    const [selection, setSelection] = useState<Selection | null>(null);
    useEffect(() => { setSearch(filters.q); }, [filters.q]);
    useEffect(() => {
        if (search === filters.q) return;
        const timeout = window.setTimeout(() => router.get('/admin/users', { q: search }, {
            preserveState: true, preserveScroll: true, replace: true, only: ['users', 'filters'],
        }), 300);
        return () => window.clearTimeout(timeout);
    }, [search, filters.q]);
    const open = (mode: DialogMode, user: Account | null = null) => setSelection({ mode, user });
    const close = () => setSelection(null);

    return <AppLayout breadcrumbs={[{ title: 'Users', href: '/admin/users' }]}>
        <Head title="Users · Administration" />
        <div className="mx-auto w-full max-w-6xl px-3 pb-12 pt-6 sm:px-6 lg:px-10">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground"><ShieldCheck className="size-3.5" /> Administration</p>
                    <h1 className="text-3xl font-medium tracking-tight">Users</h1>
                    <p className="mt-1 text-xs text-muted-foreground">Accounts, passwords and project access</p>
                </div>
                <button type="button" onClick={() => open('create')} className={solid}><Plus className="size-4" /> New user</button>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 sm:max-w-sm">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name or email…" aria-label="Search users" autoComplete="off"
                        className={projectFieldInput} />
                    {search && <button type="button" title="Clear search" aria-label="Clear search" onClick={() => setSearch('')}><X className="size-3.5 text-muted-foreground" /></button>}
                </label>
                <span className="text-[11px] text-muted-foreground">{users.total} {users.total === 1 ? 'user' : 'users'}</span>
            </div>
            <div className="space-y-1 rounded-xl bg-muted/20 p-1.5 sm:p-2">
                {users.data.map((user) => <div key={user.id}
                    className="flex min-w-0 items-center gap-3 rounded-lg px-2.5 py-3 transition-colors hover:bg-muted/55 sm:px-4">
                    <UserAvatar user={user} className="size-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-semibold">{user.name}</span>
                            {user.id === 1 && <span title="Superadmin" className="inline-flex items-center gap-1 text-[10px] text-amber-500"><ShieldCheck className="size-3.5" /> Admin</span>}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:inline-flex">
                        <Users className="size-3.5" /> {user.projects_count} projects
                    </span>
                    <span className="hidden w-20 shrink-0 text-right text-[11px] text-muted-foreground md:block">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" aria-label={'Actions for ' + user.name}
                                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                                <MoreHorizontal className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                            <DropdownMenuItem onSelect={() => open('edit', user)} className="gap-2 text-xs"><Pencil className="size-3.5" /> Edit account</DropdownMenuItem>
                            {user.id !== 1 && <>
                                <DropdownMenuItem onSelect={() => open('password', user)} className="gap-2 text-xs"><KeyRound className="size-3.5" /> Reset password</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => open('delete', user)} className="gap-2 text-xs text-red-500 focus:text-red-500"><Trash2 className="size-3.5" /> Delete user</DropdownMenuItem>
                            </>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>)}
                {!users.data.length && <div className="py-16 text-center">
                    <UserRound className="mx-auto size-8 text-muted-foreground/40" />
                    <p className="mt-3 text-xs text-muted-foreground">No users found</p>
                </div>}
            </div>
            {users.last_page > 1 && <div className="mt-4 flex items-center justify-end gap-2 text-xs">
                <span className="mr-auto text-[11px] text-muted-foreground">Page {users.current_page} of {users.last_page}</span>
                {users.prev_page_url ? <Link preserveScroll href={users.prev_page_url} className={muted}><ChevronLeft className="size-4" /> Previous</Link> : null}
                {users.next_page_url ? <Link preserveScroll href={users.next_page_url} className={muted}>Next <ChevronRight className="size-4" /></Link> : null}
            </div>}
        </div>
        {selection && <UserDialog key={selection.mode + '-' + (selection.user?.id ?? 0)} selection={selection}
            projects={projects} onClose={close} />}
    </AppLayout>;
}
