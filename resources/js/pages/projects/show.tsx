import { useMemo, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { ProjectFiles } from '@/components/projects/project-files';
import { ProjectLinks } from '@/components/projects/project-links';
import { ProjectAccessTab } from '@/components/projects/project-access';
import { AttachmentIcon, Avatar, SectionHeader, ServiceIcon, bytes, displayDate, domain, fieldClass, mutedButton, outlineButton, solidButton } from '@/components/projects/resources';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ChevronRight, ArrowUpRight, FolderKanban, Settings2, Check, CheckCheck, Clock, Link2, Files, KeyRound, LayoutGrid, Users, Trash2, Pencil, UploadCloud } from 'lucide-react';
import type { SharedData } from '@/types';
import type { Task, TaskPriority } from '@/types/task';
import type { ProjectShowProps, Person, ProjectLink } from '@/types/project';

const tabs = [
    { key: 'main', title: 'Main', Icon: LayoutGrid },
    { key: 'files', title: 'Files', Icon: Files },
    { key: 'links', title: 'Links', Icon: Link2 },
    { key: 'access', title: 'Access', Icon: KeyRound },
] as const;

const priorities: Record<TaskPriority, string> = {
    low: 'bg-green-500', medium: 'bg-blue-500', high: 'bg-amber-500', critical: 'bg-red-500',
};
function todayDate() {
    const today = new Date();
    return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
}
function taskDate(value: string) {
    return new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ProjectShow(props: ProjectShowProps) {
    const { project, tasks, pinnedLinks, recentFiles, counts, filters, availableUsers, availableProjects, canManage, canAccessVault } = props;
    const { auth } = usePage<SharedData>().props;
    const me = auth.user.id;
    const [taskSearch, setTaskSearch] = useState('');
    const [taskFilter, setTaskFilter] = useState<'open' | 'all' | 'completed'>('open');
    const [taskDrawer, setTaskDrawer] = useState<Task | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createTitle, setCreateTitle] = useState('');
    const [createPriority, setCreatePriority] = useState<TaskPriority>('medium');
    const [createDate, setCreateDate] = useState(todayDate());
    const [createBusy, setCreateBusy] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [projectName, setProjectName] = useState(project.name);
    const [projectDescription, setProjectDescription] = useState(project.description || '');
    const [projectStatus, setProjectStatus] = useState(project.status);
    const [membersOpen, setMembersOpen] = useState(false);
    const [memberIds, setMemberIds] = useState<number[]>(project.members.map((user) => user.id));
    const [formBusy, setFormBusy] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [quickTitle, setQuickTitle] = useState('');
    const [mainUploading, setMainUploading] = useState(false);
    const [pinLink, setPinLink] = useState<ProjectLink | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const base = '/projects/' + project.id;

    const openTasks = tasks.filter((task) => !task.is_completed);
    const completedTasks = tasks.filter((task) => task.is_completed);
    const overdue = openTasks.filter((task) => task.due_date.slice(0, 10) < todayDate());
    const visibleTasks = useMemo(() => tasks.filter((task) => {
        if (taskFilter === 'open' && task.is_completed) return false;
        if (taskFilter === 'completed' && !task.is_completed) return false;
        return task.title.toLowerCase().includes(taskSearch.toLowerCase());
    }).sort((a, b) => Number(a.is_completed) - Number(b.is_completed) || a.due_date.localeCompare(b.due_date)), [tasks, taskFilter, taskSearch]);

    const changeTab = (tab: string) => {
        router.get(base, { tab }, { preserveScroll: true, preserveState: false });
    };
    const submitTask = (title: string, priority: TaskPriority = 'medium', due_date = todayDate()) => {
        if (!title.trim()) return;
        setCreateBusy(true);
        router.post('/tasks', { title: title.trim(), priority, due_date, project_ids: [project.id], assigned_user_ids: [me] }, {
            preserveScroll: true,
            onSuccess: () => { setQuickTitle(''); setCreateTitle(''); setCreateOpen(false); },
            onFinish: () => setCreateBusy(false),
        });
    };
    const toggleTask = (task: Task) => {
        router.patch('/tasks', { task_id: task.id, is_completed: !task.is_completed }, { preserveScroll: true });
    };
    const saveProject = () => {
        setFormBusy(true); setFormErrors({});
        router.patch(base, { name: projectName, description: projectDescription, status: projectStatus }, {
            preserveScroll: true, onSuccess: () => setSettingsOpen(false),
            onError: setFormErrors, onFinish: () => setFormBusy(false),
        });
    };
    const saveMembers = () => {
        setFormBusy(true); setFormErrors({});
        router.put(base + '/members', { member_ids: memberIds }, {
            preserveScroll: true, onSuccess: () => setMembersOpen(false),
            onError: setFormErrors, onFinish: () => setFormBusy(false),
        });
    };
    const uploadMain = (files: FileList | null) => {
        if (!files?.length) return;
        const arr = Array.from(files);
        if (arr.length > 10 || arr.some((file) => file.size > 20 * 1024 * 1024)) {
            window.alert('Maximum 10 files per upload, 20 MB each.');
            return;
        }
        setMainUploading(true);
        router.post(base + '/files', { files: arr }, {
            forceFormData: true, preserveScroll: true,
            onSuccess: () => { if (fileRef.current) fileRef.current.value = ''; },
            onError: (errors) => window.alert(Object.values(errors)[0] || 'Upload failed'),
            onFinish: () => setMainUploading(false),
        });
    };
    const deleteProject = () => {
        if (window.confirm('Permanently delete this project and its files, links and credentials? Tasks will be kept.')) {
            router.delete(base);
        }
    };
    const settings = () => {
        setProjectName(project.name); setProjectDescription(project.description || ''); setProjectStatus(project.status);
        setFormErrors({}); setSettingsOpen(true);
    };
    const team = () => { setMemberIds(project.members.map((user) => user.id)); setFormErrors({}); setMembersOpen(true); };

    return <AppLayout breadcrumbs={[{ title: 'Projects', href: '/projects' }, { title: project.name, href: base }]}>
        <Head title={project.name + ' · Projects'} />
        <div className="mx-auto w-full max-w-[1480px] px-5 py-8 sm:px-9 lg:px-12">
            <div className="mb-4 flex items-center gap-2 text-[11px] tracking-wide text-muted-foreground">
                <Link className="hover:text-foreground" href="/projects">Projects</Link><ChevronRight className="size-3" />
                <span>PRJ-{String(project.id).padStart(3, '0')}</span>
                <span className={'ml-2 size-1.5 rounded-full ' + (project.status === 'active' ? 'bg-green-500' : project.status === 'paused' ? 'bg-amber-500' : 'bg-muted-foreground')} />
                <span className="capitalize">{project.status}</span>
            </div>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0">
                    <h1 className="break-words text-3xl font-light tracking-tight sm:text-4xl">{project.name}</h1>
                    <p className="mt-3 max-w-2xl text-xs text-muted-foreground sm:text-sm">{project.description || 'No project description yet.'}</p>
                </div>
                {canManage && <button className={outlineButton} onClick={settings}><Settings2 className="size-4" /> Edit project</button>}
            </div>
            <div className="mb-7 flex items-center gap-3">
                <div className="flex -space-x-2">{project.members.slice(0, 6).map((person) => <Avatar key={person.id} name={person.name} />)}</div>
                {canManage && <button className="grid size-8 place-items-center rounded-full bg-muted/70 hover:bg-muted" title="Manage team" onClick={team}><Plus className="size-4 text-muted-foreground" /></button>}
                <span className="text-[11px] text-muted-foreground">{project.members.length} project members</span>
            </div>

            <nav className="mb-9 flex items-center gap-7 overflow-x-auto border-b border-border/70" aria-label="Project tabs">
                {tabs.map(({ key, title, Icon }) => <button key={key} onClick={() => changeTab(key)}
                    className={'flex shrink-0 items-center gap-2 border-b-2 pb-4 pt-2 text-xs font-medium transition-colors ' + (filters.tab === key ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                    <Icon className="size-4" /> {title}
                    {key === 'files' && <span className="text-[10px] opacity-60">{counts.files}</span>}
                    {key === 'links' && <span className="text-[10px] opacity-60">{counts.links}</span>}
                </button>)}
                <button className="ml-auto shrink-0 pb-4 text-muted-foreground/50" title="More tabs coming soon" aria-label="More tabs coming soon" disabled><Plus className="size-4" /></button>
            </nav>

            {filters.tab === 'main' && <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[minmax(0,1.75fr)_minmax(285px,1fr)] xl:gap-16">
                <section className="min-w-0">
                    <SectionHeader title={'Tasks · ' + tasks.length} subtitle="Tasks linked to this project" action={<button className={outlineButton} onClick={() => { setCreateDate(todayDate()); setCreatePriority('medium'); setCreateOpen(true); }}><Plus className="size-4" /> New task</button>} />
                    <div className="mb-7 flex gap-6 text-[11px] text-muted-foreground">
                        <span><b className="mr-1 font-semibold text-foreground">{openTasks.length}</b> Open</span>
                        <span><b className="mr-1 font-semibold text-foreground">{completedTasks.length}</b> Completed</span>
                        <span><b className="mr-1 font-semibold text-red-500">{overdue.length}</b> Overdue</span>
                    </div>
                    <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3.5">
                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                        <input value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && quickTitle.trim()) submitTask(quickTitle); }}
                            placeholder="Add a task to this project…" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/70" />
                        <span className="hidden text-[10px] text-muted-foreground sm:block">↵ Enter</span>
                    </div>
                    <div className="mb-1 flex flex-wrap items-center gap-5 border-b border-border/60 pb-3">
                        {(['open', 'all', 'completed'] as const).map((filter) => <button key={filter} onClick={() => setTaskFilter(filter)}
                            className={'text-xs capitalize ' + (taskFilter === filter ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{filter === 'all' ? 'All tasks' : filter}</button>)}
                        <div className="ml-auto"><input className="w-32 max-w-full bg-transparent text-right text-xs outline-none placeholder:text-muted-foreground" placeholder="Find task…" value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} aria-label="Find task" /></div>
                    </div>
                    {visibleTasks.length ? <div className="divide-y divide-border/40">
                        {visibleTasks.map((task) => <div key={task.id} className="group flex items-center gap-3 py-3.5">
                            <button onClick={() => toggleTask(task)} className={'grid size-5 shrink-0 place-items-center rounded-full border ' + (task.is_completed ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground')} aria-label={task.is_completed ? 'Mark incomplete' : 'Mark complete'}>
                                {task.is_completed && <Check className="size-3" />}
                            </button>
                            <button onClick={() => setTaskDrawer(task)} className="min-w-0 flex-1 text-left">
                                <span className={'block truncate text-xs ' + (task.is_completed ? 'text-muted-foreground line-through' : 'font-medium')}>{task.title}</span>
                                <span className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span className={'size-1.5 rounded-full ' + priorities[task.priority]} />
                                    <span className={(!task.is_completed && task.due_date.slice(0, 10) < todayDate() ? 'text-red-500' : '')}>{taskDate(task.due_date)}</span>
                                    {task.projects.length > 1 && <span>· {task.projects.length} projects</span>}
                                </span>
                            </button>
                            <div className="hidden -space-x-2 sm:flex">{task.assigned_users.slice(0, 2).map((person: Person) => <Avatar key={person.id} name={person.name} />)}</div>
                            <button className={mutedButton} onClick={() => setTaskDrawer(task)} title="Edit task"><Pencil className="size-4" /></button>
                        </div>)}
                    </div> : <p className="py-16 text-center text-xs text-muted-foreground">No tasks in this view.</p>}
                </section>

                <aside className="min-w-0 space-y-11">
                    <section>
                        <SectionHeader title="Pinned links" action={<button className={mutedButton} onClick={() => changeTab('links')}>View all <ArrowUpRight className="size-4" /></button>} />
                        <div className="space-y-1">{pinnedLinks.length ? pinnedLinks.map((link) => <a key={link.id} target="_blank" rel="noopener noreferrer" href={link.url} className="flex items-center gap-3 rounded-lg py-2 hover:bg-muted/30">
                            <ServiceIcon kind={link.kind} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{link.title}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{domain(link.url)} · {link.category || 'General'}</span></span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50" />
                        </a>) : <p className="py-5 text-xs text-muted-foreground">No pinned links yet.</p>}</div>
                        <button className={mutedButton + ' mt-3'} onClick={() => changeTab('links')}><Plus className="size-4" /> Add link</button>
                    </section>
                    <section>
                        <SectionHeader title="Recent files" action={<button className={mutedButton} onClick={() => changeTab('files')}>All files <ArrowUpRight className="size-4" /></button>} />
                        <div className="space-y-1">{recentFiles.length ? recentFiles.slice(0, 3).map((file) => <a key={file.id} href={base + '/files/' + file.id + '/download'} className="flex items-center gap-3 rounded-lg py-2 hover:bg-muted/30">
                            <AttachmentIcon file={file} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{file.name}</span><span className="mt-1 block text-[10px] text-muted-foreground">{bytes(file.size)} · {file.uploader?.name || 'Unknown'}</span></span><ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50" />
                        </a>) : <p className="py-5 text-xs text-muted-foreground">No uploaded files yet.</p>}</div>
                        <input ref={fileRef} type="file" className="hidden" multiple onChange={(event) => uploadMain(event.target.files)} />
                        <button disabled={mainUploading} className="mt-4 flex w-full items-center gap-3 rounded-xl bg-muted/35 px-4 py-4 text-left hover:bg-muted/60 disabled:opacity-50" onClick={() => fileRef.current?.click()}>
                            <span className="grid size-9 place-items-center rounded-lg bg-background"><UploadCloud className="size-5 text-muted-foreground" /></span>
                            <span><span className="block text-xs font-medium">{mainUploading ? 'Uploading…' : 'Upload files'}</span><span className="mt-1 block text-[10px] text-muted-foreground">Add documents, images or archives</span></span>
                        </button>
                    </section>
                    <section>
                        <SectionHeader title="Project team" action={canManage && <button className={mutedButton} onClick={team}>Manage <ArrowUpRight className="size-4" /></button>} />
                        <div className="flex -space-x-2">{project.members.map((person) => <Avatar key={person.id} name={person.name} />)}</div>
                        <p className="mt-3 text-[11px] text-muted-foreground">{project.members.map((person) => person.name).join(', ')}</p>
                    </section>
                </aside>
            </div>}

            {filters.tab === 'files' && <ProjectFiles projectId={project.id} page={props.files} filters={filters} userId={me} ownerId={project.created_by} />}
            {filters.tab === 'links' && <ProjectLinks projectId={project.id} page={props.links} filters={filters} />}
            {filters.tab === 'access' && <ProjectAccessTab projectId={project.id} page={props.accesses} filters={filters} canAccessVault={canAccessVault} />}
        </div>

        <TaskDrawer task={taskDrawer} open={taskDrawer !== null} onOpenChange={(open) => { if (!open) setTaskDrawer(null); }}
            availableUsers={availableUsers} availableProjects={availableProjects} />

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>New project task</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                    <label className="grid gap-2 text-xs">Title<input className={fieldClass} autoFocus value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitTask(createTitle, createPriority, createDate); }} /></label>
                    <label className="grid gap-2 text-xs">Due date<input className={fieldClass} type="date" value={createDate} onChange={(event) => setCreateDate(event.target.value)} /></label>
                    <label className="grid gap-2 text-xs">Priority<select className={fieldClass} value={createPriority} onChange={(event) => setCreatePriority(event.target.value as TaskPriority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></label>
                    <p className="text-[11px] text-muted-foreground">The task will be linked to {project.name} and assigned to you. Change assignees or add more projects in task details.</p>
                    <div className="flex justify-end gap-2"><button className={outlineButton} onClick={() => setCreateOpen(false)}>Cancel</button><button disabled={createBusy || !createTitle.trim()} className={solidButton} onClick={() => submitTask(createTitle, createPriority, createDate)}>Create task</button></div>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Project settings</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                    <label className="grid gap-2 text-xs">Project name<input className={fieldClass} value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label>
                    <label className="grid gap-2 text-xs">Description<textarea className={fieldClass + ' min-h-24'} value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} /></label>
                    <label className="grid gap-2 text-xs">Status<select className={fieldClass} value={projectStatus} onChange={(event) => setProjectStatus(event.target.value as typeof projectStatus)}><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label>
                    {Object.values(formErrors).length > 0 && <p className="text-xs text-red-600">{Object.values(formErrors)[0]}</p>}
                    <div className="flex justify-end gap-2"><button className={mutedButton + ' mr-auto text-red-600'} onClick={deleteProject}><Trash2 className="size-4" /> Delete</button><button className={outlineButton} onClick={() => setSettingsOpen(false)}>Cancel</button><button className={solidButton} disabled={formBusy} onClick={saveProject}>Save project</button></div>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Project members</DialogTitle></DialogHeader>
                <p className="text-xs text-muted-foreground">Members can view the project, manage its files and links, and work with assigned tasks. Credentials are owner-only.</p>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                    {availableUsers.map((person) => <label key={person.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
                        <input type="checkbox" checked={memberIds.includes(person.id)} disabled={person.id === project.created_by}
                            onChange={(event) => setMemberIds((current) => event.target.checked ? [...current, person.id] : current.filter((id) => id !== person.id))} />
                        <Avatar name={person.name} /><span className="min-w-0 flex-1"><span className="block text-xs font-medium">{person.name}</span><span className="block truncate text-[11px] text-muted-foreground">{person.email}</span></span>
                        {person.id === project.created_by && <span className="text-[10px] text-muted-foreground">Owner</span>}
                    </label>)}
                </div>
                {Object.values(formErrors).length > 0 && <p className="text-xs text-red-600">{Object.values(formErrors)[0]}</p>}
                <div className="flex justify-end gap-2"><button className={outlineButton} onClick={() => setMembersOpen(false)}>Cancel</button><button className={solidButton} disabled={formBusy} onClick={saveMembers}><Users className="size-4" /> Save members</button></div>
            </DialogContent>
        </Dialog>
    </AppLayout>;
}
