import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { AlignLeft, Activity, FolderKanban, Settings2, Trash2, ChevronDown } from 'lucide-react';
import type { Project } from '@/types/project';
import { ProjectFormField, projectFieldInput } from './project-form-field';
import { ProjectResponsiveDialog } from './project-responsive-dialog';
import { outlineButton, solidButton } from './resources';

type Props = {
    project: Project;
    open: boolean;
    onOpenChange: (value: boolean) => void;
};

const statuses: Project['status'][] = ['active', 'paused', 'archived'];

export function ProjectSettingsDialog({ project, open, onOpenChange }: Props) {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [status, setStatus] = useState<Project['status']>(project.status);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!open) return;
        setName(project.name);
        setDescription(project.description || '');
        setStatus(project.status);
        setErrors({});
        setConfirmDelete(false);
    }, [open, project.id]);

    const update = () => {
        if (busy) return;
        if (!name.trim()) {
            setErrors({ name: 'Enter a project name.' });
            return;
        }
        setErrors({});
        setBusy(true);
        router.patch('/projects/' + project.id, {
            name: name.trim(),
            description: description.trim() || null,
            status,
        }, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (issues) => setErrors(issues),
            onFinish: () => setBusy(false),
        });
    };

    const destroy = () => {
        if (busy) return;
        setBusy(true);
        router.delete('/projects/' + project.id, {
            onError: (issues) => setErrors(issues),
            onFinish: () => setBusy(false),
        });
    };

    return <ProjectResponsiveDialog open={open} onOpenChange={onOpenChange}
        title="Project settings" description="Name, description and project status"
        icon={Settings2} disabled={busy}>
        <div className="space-y-3">
            <ProjectFormField id="project-settings-name" title="Project name" icon={FolderKanban} error={errors.name}>
                <input id="project-settings-name" autoFocus autoComplete="off" maxLength={150}
                    disabled={busy} className={projectFieldInput} placeholder="Project name"
                    value={name} onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); update(); } }} />
            </ProjectFormField>

            <ProjectFormField id="project-settings-description" title="Description · optional" icon={AlignLeft}
                error={errors.description} multiline>
                <textarea id="project-settings-description" className={projectFieldInput + ' min-h-16 resize-y'}
                    rows={3} maxLength={5000} disabled={busy} placeholder="What is this project about?"
                    value={description} onChange={(e) => setDescription(e.target.value)} />
            </ProjectFormField>

            <ProjectFormField id="project-settings-status" title="Status" icon={Activity} error={errors.status}>
                <span className={'size-1.5 shrink-0 rounded-full ' +
                    (status === 'active' ? 'bg-green-500' : status === 'paused' ? 'bg-amber-500' : 'bg-muted-foreground')} />
                <select id="project-settings-status" disabled={busy}
                    className={projectFieldInput + ' cursor-pointer appearance-none capitalize'}
                    value={status} onChange={(e) => setStatus(e.target.value as Project['status'])}>
                    {statuses.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </ProjectFormField>

            {errors.general && <p role="alert" className="text-xs text-red-500">{errors.general}</p>}

            {confirmDelete && <div className="space-y-2 rounded-lg bg-red-500/5 px-3 py-3">
                <p className="text-xs font-medium text-red-500">Delete this project permanently?</p>
                <p className="text-[11px] text-muted-foreground">Files, links and credentials will be deleted. Tasks will be kept.</p>
                <div className="flex justify-end gap-2">
                    <button type="button" disabled={busy} className={outlineButton} onClick={() => setConfirmDelete(false)}>Keep project</button>
                    <button type="button" disabled={busy} onClick={destroy}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                        {busy ? 'Deleting…' : 'Delete permanently'}
                    </button>
                </div>
            </div>}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3">
                {!confirmDelete && <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)}
                    className="mr-auto flex items-center gap-1.5 px-2 py-2 text-xs text-red-500 hover:text-red-600">
                    <Trash2 className="size-3.5" /> Delete
                </button>}
                <button type="button" disabled={busy} className={outlineButton} onClick={() => onOpenChange(false)}>Cancel</button>
                <button type="button" disabled={busy || confirmDelete} className={solidButton} onClick={update}>
                    {busy ? 'Saving…' : 'Save changes'}
                </button>
            </div>
        </div>
    </ProjectResponsiveDialog>;
}
