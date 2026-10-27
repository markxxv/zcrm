import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Check, LoaderCircle, Plus, Search, Users, X } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Person, Project } from '@/types/project';
import { Avatar } from './resources';

type Props = {
    project: Project;
    availableUsers: Person[];
    canManage: boolean;
    variant?: 'team' | 'settings';
};

export function ProjectMemberManager({ project, availableUsers, canManage, variant = 'team' }: Props) {
    const mobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<number[]>(() => project.members.map((member) => member.id));
    const [search, setSearch] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    // Switching projects should never carry a previous project's selection.
    useEffect(() => {
        setOpen(false);
        setSelected(project.members.map((person) => person.id));
        setSearch('');
        setError('');
    }, [project.id]);

    const toggleOpen = (next: boolean) => {
        if (busy && !next) return;
        if (next && !open) {
            setSelected(project.members.map((person) => person.id));
            setSearch('');
            setError('');
        }
        setOpen(next);
    };

    const toggleMember = (id: number, enabled: boolean) => {
        if (id === project.created_by) return;
        setSelected((current) => enabled
            ? [...new Set([...current, id])]
            : current.filter((value) => value !== id));
    };

    const submit = () => {
        if (busy) return;
        setBusy(true);
        setError('');
        router.put('/projects/' + project.id + '/members', {
            member_ids: [...new Set([...selected, project.created_by])],
        }, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
            onError: (issues) => setError(Object.values(issues)[0] || 'Unable to save team members.'),
            onFinish: () => setBusy(false),
        });
    };

    const users = availableUsers
        .filter((person) => (person.name + ' ' + person.email).toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => Number(selected.includes(b.id)) - Number(selected.includes(a.id)) || a.name.localeCompare(b.name));

    const picker = <div className="space-y-3">
        <label className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input type="search" aria-label="Search users" autoComplete="off" value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a team member…"
                className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60" />
        </label>
        <div className="max-h-60 space-y-0.5 overflow-y-auto">
            {users.length ? users.map((person) => {
                const checked = selected.includes(person.id) || person.id === project.created_by;
                const owner = person.id === project.created_by;
                return <label key={person.id}
                    className={'flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors ' +
                        (owner ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50')}>
                    <UserAvatar user={person} className="size-7 shrink-0" />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">{person.name}</span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                            {owner ? 'Owner · ' : ''}{person.email}
                        </span>
                    </span>
                    <input className="sr-only" type="checkbox" checked={checked} disabled={busy || owner}
                        onChange={(event) => toggleMember(person.id, event.target.checked)}
                        aria-label={'Assign ' + person.name} />
                    <span aria-hidden="true" className={'grid size-5 shrink-0 place-items-center rounded-md ' +
                        (checked ? 'bg-foreground text-background' : 'bg-muted/70 text-transparent')}>
                        <Check className="size-3" strokeWidth={2.5} />
                    </span>
                </label>;
            }) : <p className="py-5 text-center text-xs text-muted-foreground">No users found.</p>}
        </div>
        {error && <p role="alert" className="text-[11px] text-red-500">{error}</p>}
        <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">{new Set([...selected, project.created_by]).size} selected</span>
            <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => toggleOpen(false)}
                    className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted">Cancel</button>
                <button type="button" disabled={busy} onClick={submit}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background disabled:opacity-40">
                    {busy && <LoaderCircle className="size-3.5 animate-spin" />}
                    Save members
                </button>
            </div>
        </div>
    </div>;

    const trigger = <button type="button" disabled={!canManage}
        onClick={variant === 'settings' ? () => toggleOpen(!open) : undefined}
        title={canManage ? 'Manage project members' : 'Project members'}
        aria-label={canManage ? 'Manage project members' : 'Project members'}
        aria-expanded={canManage ? open : undefined}
        className="inline-flex max-w-full items-center gap-2 rounded-lg py-1 text-left disabled:cursor-default">
        <span className="flex -space-x-2">
            {project.members.slice(0, 6).map((person) => <Avatar key={person.id} user={person} className="size-8" />)}
        </span>
        {project.members.length > 6 && <span className="text-[11px] text-muted-foreground">+{project.members.length - 6}</span>}
        {canManage && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            {open && variant === 'settings' ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
        </span>}
    </button>;

    const caption = <p className="mt-1.5 text-[11px] text-muted-foreground">
        {project.members.map((person) => person.name).join(', ')}
    </p>;

    if (variant === 'settings') {
        return <div className="space-y-1">
            <div className="mb-2 flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">Project members</span>
                <span className="text-[10px] text-muted-foreground/70">{project.members.length}</span>
            </div>
            {trigger}
            {caption}
            {open && <div className="mt-3 rounded-xl bg-muted/20 p-3">{picker}</div>}
        </div>;
    }

    if (!canManage) {
        return <div>{trigger}{caption}</div>;
    }

    if (mobile) {
        return <div>
            <button type="button" onClick={() => toggleOpen(true)} title="Manage project members"
                className="inline-flex max-w-full items-center gap-2 rounded-lg py-1">
                <span className="flex -space-x-2">
                    {project.members.slice(0, 6).map((person) => <Avatar key={person.id} user={person} className="size-8" />)}
                </span>
                <span className="grid size-7 place-items-center rounded-full bg-muted/70 text-muted-foreground"><Plus className="size-3.5" /></span>
            </button>
            {caption}
            <Drawer open={open} onOpenChange={toggleOpen} direction="bottom">
                <DrawerContent className="max-h-[88dvh] rounded-t-2xl border-border/40">
                    <div data-vaul-no-drag className="min-h-0 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
                        <DrawerHeader className="mb-4 p-0 text-left">
                            <DrawerTitle className="text-sm font-semibold">Project members</DrawerTitle>
                        </DrawerHeader>
                        {picker}
                    </div>
                </DrawerContent>
            </Drawer>
        </div>;
    }

    return <div>
        <Popover open={open} onOpenChange={toggleOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent align="start" side="bottom" sideOffset={8}
                className="z-50 w-[min(340px,calc(100vw-2rem))] rounded-xl border-border/50 bg-popover p-4 shadow-xl">
                <p className="mb-3 text-xs font-semibold">Project members</p>
                {picker}
            </PopoverContent>
        </Popover>
        {caption}
    </div>;
}
