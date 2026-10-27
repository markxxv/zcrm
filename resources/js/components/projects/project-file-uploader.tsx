import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    AlertCircle, CheckCircle2, CloudUpload, LoaderCircle, Upload, X,
} from 'lucide-react';
import { bytes } from './resources';

export type ProjectFileUploaderHandle = {
    browse: () => void;
};

type Props = {
    projectId: number;
    compact?: boolean;
};

type UploadIssue = {
    title: string;
    detail?: string;
};

type UploadResponse = {
    files?: { id: number; name: string; size: number }[];
    message?: string;
    errors?: Record<string, string[] | string>;
};

const MAX_FILES = 10;
const MAX_SIZE = 20 * 1024 * 1024;

function validationIssues(files: File[]): UploadIssue[] {
    const issues: UploadIssue[] = [];

    if (files.length > MAX_FILES) {
        issues.push({
            title: 'Too many files',
            detail: 'Select up to 10 files per upload. You selected ' + files.length + '.',
        });
    }

    for (const file of files) {
        if (file.size > MAX_SIZE) {
            issues.push({
                title: file.name,
                detail: bytes(file.size) + ' exceeds the 20 MB per-file limit.',
            });
        }
    }

    return issues;
}

function parseError(xhr: XMLHttpRequest, selected: File[]): UploadIssue[] {
    let json: UploadResponse = {};
    try {
        json = JSON.parse(xhr.responseText) as UploadResponse;
    } catch {
        // Proxy-generated 413, PHP errors and network responses may be HTML.
    }

    if (xhr.status === 413) {
        return [{ title: 'Upload exceeds the server limit', detail: 'Reduce the batch size or check Nginx client_max_body_size and PHP post_max_size.' }];
    }

    if (xhr.status === 419) {
        return [{ title: 'Session expired', detail: 'Refresh the page and try again.' }];
    }

    if (xhr.status === 401 || xhr.status === 403) {
        return [{ title: 'Upload not permitted', detail: 'Your account cannot upload files to this project.' }];
    }

    if (xhr.status === 422 && json.errors) {
        return Object.entries(json.errors).flatMap(([field, errors]) => {
            const index = field.match(/^files\.(\d+)$/)?.[1];
            const title = index !== undefined && selected[Number(index)]
                ? selected[Number(index)].name
                : field === 'files' ? 'Files' : field;
            return (Array.isArray(errors) ? errors : [errors]).map((detail) => ({
                title, detail: String(detail),
            }));
        });
    }

    if (xhr.status >= 500) {
        return [{ title: 'Server error', detail: 'The server could not save these files. Try again or check application logs.' }];
    }

    return [{
        title: 'Upload failed' + (xhr.status ? ' (HTTP ' + xhr.status + ')' : ''),
        detail: json.message || 'Check your connection and try again.',
    }];
}

/**
 * Shared upload UI for Main and Files. Real XHR upload progress, drop support,
 * inline errors, cancel, retry and Inertia data refresh without tab navigation.
 */
export const ProjectFileUploader = forwardRef<ProjectFileUploaderHandle, Props>(
    function ProjectFileUploader({ projectId, compact = false }, ref) {
        const inputRef = useRef<HTMLInputElement>(null);
        const xhrRef = useRef<XMLHttpRequest | null>(null);
        const dragDepth = useRef(0);
        const [dragging, setDragging] = useState(false);
        const [busy, setBusy] = useState(false);
        const [progress, setProgress] = useState(0);
        const [pending, setPending] = useState<{ name: string; size: number }[]>([]);
        const [issues, setIssues] = useState<UploadIssue[]>([]);
        const [success, setSuccess] = useState('');
        const [cancelled, setCancelled] = useState(false);

        const browse = () => { if (!xhrRef.current) inputRef.current?.click(); };
        useImperativeHandle(ref, () => ({ browse }));

        useEffect(() => {
            return () => { xhrRef.current?.abort(); };
        }, [projectId]);

        function upload(list: FileList | File[]) {
            if (xhrRef.current) return;
            const selected = Array.from(list);
            if (!selected.length) return;

            setSuccess('');
            setIssues([]);
            setCancelled(false);

            const failures = validationIssues(selected);
            if (failures.length) {
                setIssues(failures);
                return;
            }

            const body = new FormData();
            selected.forEach((file) => body.append('files[]', file));

            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;
            setPending(selected.map((file) => ({ name: file.name, size: file.size })));
            setProgress(0);
            setBusy(true);

            xhr.open('POST', '/projects/' + projectId + '/files');
            xhr.withCredentials = true;
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            const cookie = document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='));
            const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
            const token = cookie ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length)) : meta?.content;
            if (token) xhr.setRequestHeader(cookie ? 'X-XSRF-TOKEN' : 'X-CSRF-TOKEN', token);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && xhrRef.current === xhr) {
                    setProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
                }
            };

            xhr.onload = () => {
                if (xhrRef.current !== xhr) return;
                if (xhr.status >= 200 && xhr.status < 300) {
                    let response: UploadResponse | null = null;
                    try { response = JSON.parse(xhr.responseText) as UploadResponse; } catch { /* handled below */ }
                    if (Array.isArray(response?.files) && response.files.length === selected.length) {
                        const total = selected.reduce((n, file) => n + file.size, 0);
                        setProgress(100);
                        setSuccess(selected.length + ' file' + (selected.length > 1 ? 's' : '') + ' uploaded · ' + bytes(total));
                        setIssues([]);
                        // Preserve the active Main/Files tab and any unsaved filters.
                        router.reload({
                            only: ['recentFiles', 'files', 'counts'],
                        });
                    } else {
                        setIssues([{ title: 'Unexpected server response', detail: 'Verify that the latest CRM backend has been deployed.' }]);
                    }
                } else {
                    setIssues(parseError(xhr, selected));
                }
            };

            xhr.onerror = () => {
                if (xhrRef.current === xhr) {
                    setIssues([{ title: 'Connection interrupted', detail: 'The upload could not reach the server. Check your connection and try again.' }]);
                }
            };

            xhr.onabort = () => {
                if (xhrRef.current === xhr) setCancelled(true);
            };

            xhr.onloadend = () => {
                if (xhrRef.current !== xhr) return;
                xhrRef.current = null;
                setBusy(false);
                setPending([]);
                if (inputRef.current) inputRef.current.value = '';
            };

            try {
                xhr.send(body);
            } catch {
                xhrRef.current = null;
                setBusy(false);
                setPending([]);
                setIssues([{ title: 'Unable to start upload', detail: 'Check your browser connection and try again.' }]);
            }
        }

        const handleDrop = (event: React.DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            dragDepth.current = 0;
            setDragging(false);
            upload(event.dataTransfer.files);
        };

        const dragEnter = (event: React.DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            if (!event.dataTransfer.types.includes('Files')) return;
            dragDepth.current++;
            setDragging(true);
        };

        const dragLeave = (event: React.DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (dragDepth.current === 0) setDragging(false);
        };

        return <div className={compact ? 'mt-3' : 'mb-6'}>
            <input
                ref={inputRef}
                type="file"
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-label="Select files to upload"
                onChange={(event) => upload(event.currentTarget.files || [])}
            />
            <div
                onDragEnter={dragEnter}
                onDragOver={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (event.dataTransfer.types.includes('Files')) event.dataTransfer.dropEffect = busy ? 'none' : 'copy';
                }}
                onDragLeave={dragLeave}
                onDrop={handleDrop}
                className={
                    'rounded-xl border border-dashed transition-colors ' +
                    (dragging
                        ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/25'
                        : 'border-border/70 bg-muted/25 hover:bg-muted/40')
                }
            >
                <button
                    type="button"
                    disabled={busy}
                    className={'flex w-full items-center gap-3 text-left disabled:cursor-wait ' +
                        (compact ? 'p-3.5' : 'p-5')}
                    onClick={browse}
                >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background">
                        {busy ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : <CloudUpload className="size-4 text-muted-foreground" />}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold">{dragging ? 'Drop files to upload' : busy ? 'Uploading files…' : 'Drop files here or choose files'}</span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                            {compact ? 'Up to 10 files · 20 MB each' : 'Private storage · up to 10 files per batch · 20 MB per file'}
                        </span>
                    </span>
                    {!busy && <Upload className="size-4 shrink-0 text-muted-foreground" />}
                </button>
            </div>

            {busy && <div className="mt-3 space-y-2" role="status" aria-live="polite">
                <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="min-w-0 truncate text-muted-foreground">
                        {progress >= 100 ? 'Saving files…' : 'Uploading ' + pending.length + ' file' + (pending.length === 1 ? '' : 's') + '…'}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 font-medium">
                        {progress}%
                        <button type="button" onClick={() => xhrRef.current?.abort()} className="text-muted-foreground hover:text-foreground" aria-label="Cancel upload"><X className="size-3.5" /></button>
                    </span>
                </div>
                <div
                    role="progressbar"
                    aria-label="File upload progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                    <div className="h-full rounded-full bg-foreground transition-[width] duration-150" style={{ width: progress + '%' }} />
                </div>
                <p className="truncate text-[10px] text-muted-foreground" title={pending.map(f => f.name).join(', ')}>
                    {pending.map(f => f.name).join(', ')}
                </p>
            </div>}

            {cancelled && !busy && <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Upload cancelled.</span>
                <button type="button" className="underline" onClick={browse}>Try again</button>
            </div>}

            {success && !busy && <div className="mt-3 flex items-center gap-2 text-[11px] text-green-700 dark:text-green-400" role="status">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">{success}</span>
                <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss upload confirmation"><X className="size-3.5" /></button>
            </div>}

            {issues.length > 0 && !busy && <div role="alert" className="mt-3 rounded-lg bg-red-50/70 p-3 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-400">
                <div className="mb-1.5 flex items-center gap-2 font-semibold">
                    <AlertCircle className="size-4 shrink-0" />
                    {issues.length === 1 ? 'Upload error' : issues.length + ' upload errors'}
                    <button type="button" onClick={() => setIssues([])} className="ml-auto" aria-label="Dismiss upload errors"><X className="size-3.5" /></button>
                </div>
                <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-4">
                    {issues.map((issue, index) => <li key={index} className="break-words">
                        <strong className="font-semibold">{issue.title}</strong>{issue.detail ? ': ' + issue.detail : ''}
                    </li>)}
                </ul>
                <button type="button" onClick={browse} className="mt-2 text-[11px] font-medium underline">Choose files again</button>
            </div>}
        </div>;
    },
);
