import { useCallback, useEffect, useRef, useState } from 'react';
import { ChunkUploader } from '@/components/files/chunk-uploader';
import {
    Check, ExternalLink, File, FileArchive, FileImage, FileText, Globe2,
    Link2, LoaderCircle, Paperclip, Pencil, Plus, Presentation, Table2,
    Trash2, X,
} from 'lucide-react';

type TaskFile = {
    id: number;
    name: string;
    extension: string | null;
    size: number;
};

type TaskLink = {
    id: number;
    title: string;
    url: string;
    kind: 'docs' | 'sheets' | 'slides' | 'drive' | 'figma' | 'web';
};

type TaskResources = { files: TaskFile[]; links: TaskLink[] };

function csrfToken(): string {
    const cookie = document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='));
    if (cookie) return decodeURIComponent(cookie.slice('XSRF-TOKEN='.length));
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
}

function fileSize(size: number): string {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileIcon({ extension }: { extension: string | null }) {
    const ext = (extension || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
        return <FileImage className="size-3.5 shrink-0 text-blue-500" />;
    }
    if (ext === 'pdf') return <FileText className="size-3.5 shrink-0 text-red-500" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <FileArchive className="size-3.5 shrink-0 text-purple-500" />;
    }
    return <File className="size-3.5 shrink-0 text-muted-foreground" />;
}

function LinkIcon({ kind }: { kind: TaskLink['kind'] }) {
    if (kind === 'docs') return <FileText className="size-3.5 shrink-0 text-blue-500" />;
    if (kind === 'sheets') return <Table2 className="size-3.5 shrink-0 text-green-600" />;
    if (kind === 'slides') return <Presentation className="size-3.5 shrink-0 text-amber-500" />;
    if (kind === 'drive') return <File className="size-3.5 shrink-0 text-green-500" />;
    return <Globe2 className="size-3.5 shrink-0 text-muted-foreground" />;
}

async function jsonRequest<T>(url: string, method = 'GET', payload?: FormData | object, signal?: AbortSignal): Promise<T> {
    const form = payload instanceof FormData;
    const response = await fetch(url, {
        method,
        signal,
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': csrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
            ...(payload && !form ? { 'Content-Type': 'application/json' } : {}),
        },
        body: payload ? (form ? payload : JSON.stringify(payload)) : undefined,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errors = data.errors as Record<string, string[]> | undefined;
        const message = errors && Object.values(errors)[0]?.[0];
        throw new Error(message || (data.message as string) || 'Unable to save the attachment.');
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
}

const iconButton = 'grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40';
const inlineField = 'min-w-0 rounded-md bg-muted/50 px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:bg-muted';

export function TaskAttachments({ taskId, onFilesChanged }: { taskId: number; onFilesChanged?: () => void }) {
    const base = '/tasks/' + taskId;
    const [files, setFiles] = useState<TaskFile[]>([]);
    const [links, setLinks] = useState<TaskLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [addingLink, setAddingLink] = useState(false);
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [editingLink, setEditingLink] = useState<number | null>(null);
    const [editingFile, setEditingFile] = useState<number | null>(null);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedUrl, setEditedUrl] = useState('');
    const [renamedFile, setRenamedFile] = useState('');
    const currentTask = useRef(taskId);
    currentTask.current = taskId;

    const refresh = useCallback(async (signal?: AbortSignal) => {
        const result = await jsonRequest<TaskResources>(base + '/attachments', 'GET', undefined, signal);
        if (currentTask.current !== taskId) return;
        setFiles(result.files);
        setLinks(result.links);
    }, [base, taskId]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setFiles([]);
        setLinks([]);
        setError('');
        setBusy(false);
        setAddingLink(false);
        setEditingLink(null);
        setEditingFile(null);

        refresh(controller.signal)
            .catch((err: unknown) => {
                if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load attachments.');
            })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });

        return () => controller.abort();
    }, [refresh]);

    const run = async (callback: () => Promise<void>, filesChanged = false) => {
        if (busy) return;
        setBusy(true);
        setError('');
        const id = taskId;
        try {
            await callback();
            if (currentTask.current === id) {
                await refresh();
                if (filesChanged) onFilesChanged?.();
            }
        } catch (err) {
            if (currentTask.current === id) setError(err instanceof Error ? err.message : 'Operation failed.');
        } finally {
            if (currentTask.current === id) setBusy(false);
        }
    };

    const addLink = () => {
        if (!linkUrl.trim() || !linkTitle.trim()) {
            setError('Enter a link name and URL.');
            return;
        }
        void run(async () => {
            await jsonRequest(base + '/links', 'POST', { title: linkTitle.trim(), url: linkUrl.trim() });
            setLinkTitle('');
            setLinkUrl('');
            setAddingLink(false);
        });
    };

    const editLink = (link: TaskLink) => {
        setEditingFile(null);
        setEditingLink(link.id);
        setEditedTitle(link.title);
        setEditedUrl(link.url);
        setError('');
    };

    const saveLink = (id: number) => {
        void run(async () => {
            await jsonRequest(base + '/links/' + id, 'PATCH', { title: editedTitle.trim(), url: editedUrl.trim() });
            setEditingLink(null);
        });
    };

    const renameFile = (id: number) => {
        if (!renamedFile.trim()) {
            setError('Enter a filename.');
            return;
        }
        void run(async () => {
            await jsonRequest(base + '/files/' + id, 'PATCH', { name: renamedFile.trim() });
            setEditingFile(null);
        }, true);
    };

    return <div className="space-y-4 text-xs">
        <div>
            <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                    <Paperclip className="size-3.5 text-muted-foreground" />
                    Files <span className="font-normal text-muted-foreground">{files.length || ''}</span>
                </span>
                <ChunkUploader key={taskId} scope="task" targetId={taskId} mode="inline"
                    onUploaded={() => { void refresh().then(() => onFilesChanged?.()); }} />
            </div>
            {files.length > 0 && <div className="space-y-0.5">
                {files.map((file) => <div key={file.id} className="group flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/40">
                    <FileIcon extension={file.extension} />
                    {editingFile === file.id ? (
                        <>
                            <input autoFocus className={inlineField + ' flex-1'} aria-label="Filename"
                                value={renamedFile} onChange={(e) => setRenamedFile(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); renameFile(file.id); } }} />
                            <button type="button" className={iconButton} disabled={busy} onClick={() => renameFile(file.id)} aria-label="Save filename"><Check className="size-3.5" /></button>
                            <button type="button" className={iconButton} onClick={() => setEditingFile(null)} aria-label="Cancel"><X className="size-3.5" /></button>
                        </>
                    ) : (
                        <>
                            <a href={base + '/files/' + file.id + '/download'} className="min-w-0 flex-1 truncate hover:underline" title={file.name}>{file.name}</a>
                            <span className="shrink-0 text-[10px] text-muted-foreground">{fileSize(file.size)}</span>
                            <button type="button" className={iconButton} disabled={busy} aria-label={'Rename ' + file.name}
                                onClick={() => { setEditingLink(null); setEditingFile(file.id); setRenamedFile(file.name); }}>
                                <Pencil className="size-3.5" />
                            </button>
                            <button type="button" className={iconButton} disabled={busy} aria-label={'Remove ' + file.name}
                                onClick={() => void run(async () => { await jsonRequest(base + '/files/' + file.id, 'DELETE'); }, true)}>
                                <Trash2 className="size-3.5" />
                            </button>
                        </>
                    )}
                </div>)}
            </div>}
        </div>

        <div>
            <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                    <Link2 className="size-3.5 text-muted-foreground" />
                    Links <span className="font-normal text-muted-foreground">{links.length || ''}</span>
                </span>
                <button type="button" disabled={busy} onClick={() => { setAddingLink((open) => !open); setError(''); }}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                    <Plus className="size-3.5" /> Add link
                </button>
            </div>
            {links.length > 0 && <div className="space-y-0.5">
                {links.map((link) => <div key={link.id} className="group flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/40">
                    <LinkIcon kind={link.kind} />
                    {editingLink === link.id ? (
                        <>
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-0.5">
                                <input autoFocus className={inlineField} aria-label="Link name" value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveLink(link.id); } }} />
                                <input className={inlineField} type="url" aria-label="Link URL" value={editedUrl}
                                    onChange={(e) => setEditedUrl(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveLink(link.id); } }} />
                            </div>
                            <button type="button" className={iconButton} disabled={busy} aria-label="Save link"
                                onClick={() => saveLink(link.id)}><Check className="size-3.5" /></button>
                            <button type="button" className={iconButton} aria-label="Cancel" onClick={() => setEditingLink(null)}><X className="size-3.5" /></button>
                        </>
                    ) : (
                        <>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate hover:underline" title={link.url}>{link.title}</a>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className={iconButton} aria-label={'Open ' + link.title}><ExternalLink className="size-3" /></a>
                            <button type="button" className={iconButton} disabled={busy} aria-label={'Edit ' + link.title} onClick={() => editLink(link)}><Pencil className="size-3.5" /></button>
                            <button type="button" className={iconButton} disabled={busy} aria-label={'Remove ' + link.title}
                                onClick={() => void run(async () => { await jsonRequest(base + '/links/' + link.id, 'DELETE'); })}>
                                <Trash2 className="size-3.5" />
                            </button>
                        </>
                    )}
                </div>)}
            </div>}
            {addingLink && <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted/30 p-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input autoFocus className={inlineField} value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)}
                        aria-label="Link name" placeholder="Link name"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
                    <input className={inlineField} type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                        aria-label="URL" placeholder="https://docs.google.com/..."
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
                </div>
                <button type="button" disabled={busy} onClick={addLink} className={iconButton} aria-label="Save link">
                    <Check className="size-3.5" />
                </button>
                <button type="button" onClick={() => setAddingLink(false)} className={iconButton} aria-label="Cancel">
                    <X className="size-3.5" />
                </button>
            </div>}
        </div>

        {loading && <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" /> Loading attachments…</div>}
        {busy && <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" /> Saving…</div>}
        {error && <p role="alert" className="text-[11px] text-red-500">{error}</p>}
    </div>;
}
