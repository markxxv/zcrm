import { router } from '@inertiajs/react';
import { AlignLeft, FolderKanban } from 'lucide-react';
import { useState } from 'react';

type Props = {
    compact?: boolean;
    onClose: () => void;
};

const field = 'min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70';
const group = 'flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5 focus-within:bg-muted/80';

export function ProjectCreateForm({ compact = false, onClose }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('active');
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const submit = () => {
        if (busy) return;

        const value = name.trim();
        if (!value) {
            setErrors({ name: 'Enter a project name.' });
            return;
        }

        setBusy(true);
        setErrors({});

        router.post('/projects', compact
            ? { name: value }
            : { name: value, description: description.trim() || null, status }, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: (issues: Record<string, string>) => setErrors(issues),
            onFinish: () => setBusy(false),
        });
    };

    return <div className="space-y-3">
        <label className={group}>
            <FolderKanban className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="sr-only">Project name</span>
            <input
                autoFocus
                type="text"
                autoComplete="off"
                maxLength={150}
                value={name}
                disabled={busy}
                onChange={(event) => {
                    setName(event.target.value);
                    if (errors.name) setErrors({});
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        submit();
                    }
                }}
                placeholder="Project name"
                aria-invalid={Boolean(errors.name)}
                className={field}
            />
        </label>
        {errors.name && <p role="alert" className="px-1 text-[11px] text-red-500">{errors.name}</p>}

        {!compact && <>
            <label className={group + ' items-start'}>
                <AlignLeft className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="sr-only">Description</span>
                <textarea
                    className={field + ' min-h-20 resize-y'}
                    rows={3}
                    maxLength={5000}
                    placeholder="Description · optional"
                    value={description}
                    disabled={busy}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </label>
            {errors.description && <p role="alert" className="px-1 text-[11px] text-red-500">{errors.description}</p>}
            <label className="flex items-center justify-between gap-3 px-1 text-xs">
                <span className="text-muted-foreground">Status</span>
                <select
                    className="rounded-lg bg-muted/50 px-2.5 py-1.5 outline-none"
                    value={status}
                    disabled={busy}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                </select>
            </label>
            {errors.status && <p role="alert" className="px-1 text-[11px] text-red-500">{errors.status}</p>}
        </>}

        {compact && <p className="px-1 text-[11px] text-muted-foreground">
            Active · No description
        </p>}
        <div className="flex justify-end gap-2 pt-1">
            <button type="button" disabled={busy} className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50" onClick={onClose}>Cancel</button>
            <button type="button" disabled={busy || !name.trim()} onClick={submit}
                className="rounded-lg bg-foreground px-3.5 py-2 text-xs font-medium text-background hover:opacity-80 disabled:opacity-40">
                {busy ? 'Creating…' : 'Create project'}
            </button>
        </div>
    </div>;
}
