import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowUpRight, FolderKanban, Plus, Users, CheckCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Item = { id: number; name: string; description: string | null; status: string; created_by: number; members_count: number; tasks_count: number };
type Props = { projects: Item[] };
const field = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40';

export default function ProjectsIndex({ projects }: Props) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('active');
    const [busy, setBusy] = useState(false);
    const create = () => {
        if (!name.trim()) return;
        setBusy(true);
        router.post('/projects', { name, description, status }, {
            onSuccess: () => setOpen(false),
            onFinish: () => setBusy(false),
        });
    };

    return <AppLayout breadcrumbs={[{ title: 'Projects', href: '/projects' }]}>
        <Head title="Projects" />
        <div className="mx-auto w-full max-w-6xl px-5 py-9 sm:px-9 lg:px-12">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
                <div>
                    <p className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">Workspace / Projects</p>
                    <h1 className="text-4xl font-light tracking-tight">Projects</h1>
                    <p className="mt-3 text-sm text-muted-foreground">Tasks, team, files, links and access in one place.</p>
                </div>
                <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-xs font-medium text-background hover:opacity-80"><Plus className="size-4" /> New project</button>
            </div>
            {projects.length ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                        <Link key={project.id} href={'/projects/' + project.id} className="group flex min-h-48 flex-col rounded-xl bg-muted/40 p-6 transition-colors hover:bg-muted/70">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[11px] text-muted-foreground"><FolderKanban className="size-4" /> Project #{project.id}</span>
                                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </div>
                            <h2 className="mt-7 text-xl font-medium tracking-tight">{project.name}</h2>
                            <p className="mt-2 line-clamp-2 flex-1 text-xs text-muted-foreground">{project.description || 'No description'}</p>
                            <div className="mt-7 flex gap-5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Users className="size-3.5" /> {project.members_count} members</span>
                                <span className="flex items-center gap-1.5"><CheckCheck className="size-3.5" /> {project.tasks_count} tasks</span>
                                <span className="ml-auto capitalize">{project.status}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : <div className="py-28 text-center text-sm text-muted-foreground"><FolderKanban className="mx-auto mb-4 size-9 opacity-30" />No projects yet. Create your first project.</div>}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
                <label className="grid gap-2 text-xs font-medium">Project name<input autoFocus className={field} value={name} maxLength={150} onChange={(e) => setName(e.target.value)} /></label>
                <label className="grid gap-2 text-xs font-medium">Description<textarea className={field + ' min-h-24 resize-y'} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
                <label className="grid gap-2 text-xs font-medium">Status<select className={field} value={status} onChange={(e) => setStatus(e.target.value)}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label>
                <div className="flex justify-end gap-2"><button className="rounded-lg px-4 py-2 text-xs hover:bg-muted" onClick={() => setOpen(false)}>Cancel</button><button disabled={!name.trim() || busy} className="rounded-lg bg-foreground px-4 py-2 text-xs text-background disabled:opacity-50" onClick={create}>{busy ? 'Creating…' : 'Create project'}</button></div>
            </DialogContent>
        </Dialog>
    </AppLayout>;
}
