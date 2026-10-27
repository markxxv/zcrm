import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    AlertCircle, CheckCircle2, CloudUpload, LoaderCircle, Pause,
    Play, RotateCcw, Upload, X,
} from 'lucide-react';

export type ChunkUploaderHandle = { browse: () => void };
export type UploadScope = 'project' | 'task';
type Mode = 'full' | 'compact' | 'inline';
type UploadStage = 'pending' | 'uploading' | 'assembling' | 'done' | 'paused' | 'error';
type Item = { name: string; size: number; progress: number; stage: UploadStage; error?: string };
type State = {
    id: string;
    chunk_size: number;
    total_chunks: number;
    received: number[];
    assembled_chunks: number;
    status: string;
};
type Props = {
    scope: UploadScope;
    targetId: number;
    mode?: Mode;
    onUploaded?: () => void;
};

const FILE_LIMIT = 10;
const MAX_SIZE = 1024 * 1024 * 1024;
const PARALLEL_CHUNKS = 3;

function readableBytes(value: number): string {
    if (value < 1024) return value + ' B';
    if (value < 1024 * 1024) return Math.round(value / 1024) + ' KB';
    return (value / (1024 * 1024)).toFixed(1) + ' MB';
}

function xsrfHeader(): Record<string, string> {
    const cookie = document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='));
    if (cookie) return { 'X-XSRF-TOKEN': decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) };
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    return token ? { 'X-CSRF-TOKEN': token } : {};
}

async function request<T>(path: string, method: string, body?: FormData | object, signal?: AbortSignal): Promise<T> {
    const form = body instanceof FormData;
    let response: Response;
    try {
        response = await fetch(path, {
            method, signal, credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...xsrfHeader(),
                ...(body && !form ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body ? form ? body : JSON.stringify(body) : undefined,
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        throw new Error('Connection interrupted. Use Resume to continue from saved chunks.');
    }

    if (!response.ok) {
        if (response.status === 413) {
            throw new Error('Chunk rejected by Nginx (HTTP 413). The server request limit is below 300 KB.');
        }
        if (response.status === 419) throw new Error('Session expired. Refresh the page and choose the file again.');
        if (response.status === 401 || response.status === 403) throw new Error('You are not allowed to upload to this item.');
        if (response.status === 410) throw new Error('Upload expired. Select the file again.');
        const data = await response.json().catch(() => null);
        const errors = data?.errors as Record<string, string[]> | undefined;
        const detail = errors && Object.values(errors)[0]?.[0];
        throw new Error(detail || data?.message || 'Upload error (HTTP ' + response.status + ').');
    }

    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
}

async function sha256(input: ArrayBuffer | Uint8Array): Promise<string> {
    const source = input instanceof Uint8Array ? input : new Uint8Array(input);
    const hash = await crypto.subtle.digest('SHA-256', source as BufferSource);
    return [...new Uint8Array(hash)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

async function sendPart(url: string, data: FormData, signal: AbortSignal): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await request(url, 'POST', data, signal);
            return;
        } catch (error) {
            if (signal.aborted) throw error;
            if (attempt === 2 || (error instanceof Error && /403|401|419|410|409|422|413/.test(error.message))) {
                throw error;
            }
            await new Promise<void>((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
        }
    }
}

export const ChunkUploader = forwardRef<ChunkUploaderHandle, Props>(
    function ChunkUploader({ scope, targetId, mode = 'full', onUploaded }, ref) {
        const input = useRef<HTMLInputElement>(null);
        const controller = useRef<AbortController | null>(null);
        const selected = useRef<File[]>([]);
        const sessionIds = useRef<string[]>([]);
        const sessionKeys = useRef<string[]>([]);
        const current = useRef(0);
        const running = useRef(false);
        const dragDepth = useRef(0);
        const callback = useRef(onUploaded);
        callback.current = onUploaded;

        const [items, setItems] = useState<Item[]>([]);
        const [working, setWorking] = useState(false);
        const [dragging, setDragging] = useState(false);
        const [message, setMessage] = useState('');
        const [error, setError] = useState('');
        const [paused, setPaused] = useState(false);

        useImperativeHandle(ref, () => ({
            browse: () => { if (!running.current) input.current?.click(); },
        }));

        useEffect(() => {
            return () => controller.current?.abort();
        }, [scope, targetId]);

        function patch(index: number, changes: Partial<Item>) {
            setItems((prev) => prev.map((item, i) => i === index ? { ...item, ...changes } : item));
        }

        async function transfer(file: File, position: number, signal: AbortSignal) {
            const clientKey = await sha256(new TextEncoder().encode(
                JSON.stringify([scope, targetId, file.name, file.size, file.lastModified])
            ));
            const storageKey = 'zcrm:chunk:' + clientKey;
            let resumeId: string | null = null;
            try { resumeId = localStorage.getItem(storageKey); } catch { /* private browsing */ }
            const state = await request<State>('/uploads/start', 'POST', {
                target_type: scope,
                target_id: targetId,
                name: file.name,
                size: file.size,
                mime_type: file.type || null,
                client_key: clientKey,
                ...(resumeId ? { resume_id: resumeId } : {}),
            }, signal);
            try { localStorage.setItem(storageKey, state.id); } catch { /* optional */ }
            if (state.status === 'completed') {
                try { localStorage.removeItem(storageKey); } catch { /* optional */ }
                patch(position, { stage: 'done', progress: 100 });
                callback.current?.();
                return;
            }
            sessionIds.current[position] = state.id;
            sessionKeys.current[position] = storageKey;

            const chunkSize = state.chunk_size;
            const total = state.total_chunks;
            const received = new Set(state.received);
            const partBytes = (i: number) => Math.min(chunkSize, file.size - i * chunkSize);
            let accepted = state.received.reduce((sum, i) => sum + partBytes(i), 0);
            patch(position, { stage: 'uploading', progress: Math.round(accepted / file.size * 90), error: undefined });

            const missing: number[] = [];
            for (let i = 0; i < total; i++) if (!received.has(i)) missing.push(i);

            let cursor = 0;
            await Promise.all(Array.from({ length: Math.min(PARALLEL_CHUNKS, missing.length) }, async () => {
                while (cursor < missing.length) {
                    if (signal.aborted) throw new DOMException('Paused', 'AbortError');
                    const index = missing[cursor++];
                    const start = index * chunkSize;
                    const body = file.slice(start, Math.min(start + chunkSize, file.size));
                    const bytes = await body.arrayBuffer();
                    const form = new FormData();
                    form.append('chunk', new Blob([bytes]), 'chunk.part');
                    form.append('sha256', await sha256(bytes));
                    await sendPart('/uploads/' + state.id + '/chunks/' + index, form, signal);
                    accepted += body.size;
                    patch(position, { progress: Math.round(accepted / file.size * 90) });
                }
            }));

            let assembled = state.assembled_chunks;
            patch(position, { stage: 'assembling', progress: 90 });
            while (assembled < total) {
                const reply = await request<{ assembled_chunks: number }>(
                    '/uploads/' + state.id + '/assemble', 'POST', {}, signal
                );
                if (reply.assembled_chunks <= assembled) throw new Error('Server did not advance file assembly.');
                assembled = reply.assembled_chunks;
                patch(position, { progress: 90 + Math.round(assembled / total * 9) });
            }

            await request('/uploads/' + state.id + '/complete', 'POST', {}, signal);
            try { localStorage.removeItem(storageKey); } catch { /* optional */ }
            patch(position, { stage: 'done', progress: 100 });
            callback.current?.();
        }

        async function run() {
            if (running.current) return;
            const abort = new AbortController();
            controller.current = abort;
            running.current = true;
            setWorking(true);
            setPaused(false);
            setError('');
            setMessage('');

            try {
                for (let i = current.current; i < selected.current.length; i++) {
                    current.current = i;
                    await transfer(selected.current[i], i, abort.signal);
                }
                setMessage(selected.current.length + ' file(s) uploaded successfully.');
                current.current = selected.current.length;
            } catch (err) {
                if (abort.signal.aborted) {
                    setPaused(true);
                    patch(current.current, { stage: 'paused' });
                } else {
                    const detail = err instanceof Error ? err.message : 'Upload failed.';
                    setError(detail);
                    patch(current.current, { stage: 'error', error: detail });
                }
            } finally {
                if (controller.current === abort) {
                    controller.current = null;
                    running.current = false;
                    setWorking(false);
                }
            }
        }

        function pick(inputFiles: FileList | File[]) {
            if (running.current) return;
            const arr = Array.from(inputFiles);
            if (!arr.length) return;
            if (arr.length > FILE_LIMIT) { setError('Maximum 10 files per batch.'); return; }
            if (arr.some((file) => file.size === 0 || file.size > MAX_SIZE)) {
                setError('Files must be between 1 byte and 1 GB each.');
                return;
            }
            if (!crypto?.subtle) { setError('Secure browser context (HTTPS) is required for checked uploads.'); return; }
            selected.current = arr;
            current.current = 0;
            sessionIds.current = [];
            sessionKeys.current = [];
            setItems(arr.map((file) => ({ name: file.name, size: file.size, progress: 0, stage: 'pending' })));
            setError('');
            setMessage('');
            setPaused(false);
            if (input.current) input.current.value = '';
            void run();
        }

        function pause() {
            controller.current?.abort();
        }

        async function cancel() {
            pause();
            const ids = [...sessionIds.current];
            for (const key of sessionKeys.current) {
                try { localStorage.removeItem(key); } catch { /* optional */ }
            }
            sessionKeys.current = [];
            selected.current = [];
            current.current = 0;
            sessionIds.current = [];
            // The server clears any upload sessions that have been started.
            await Promise.allSettled(ids.map((id) => request('/uploads/' + id, 'DELETE')));
            setItems([]);
            setPaused(false);
            setWorking(false);
            setError('');
            setMessage('Upload cancelled.');
        }

        const drop = (event: React.DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            dragDepth.current = 0;
            setDragging(false);
            if (!running.current) pick(event.dataTransfer.files);
        };
        const enter = (event: React.DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            if (!event.dataTransfer.types.includes('Files')) return;
            dragDepth.current++;
            setDragging(true);
        };
        const leave = (event: React.DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            dragDepth.current = Math.max(0, dragDepth.current - 1);
            if (!dragDepth.current) setDragging(false);
        };

        const inline = mode === 'inline';
        const compact = mode === 'compact';
        const totalCompleted = items.filter((item) => item.stage === 'done').length;

        return <div className={inline ? 'min-w-0' : compact ? 'mt-2' : 'mb-6'}>
            <input ref={input} className="sr-only" type="file" tabIndex={-1} multiple
                aria-label="Select files to upload" onChange={(event) => pick(event.currentTarget.files || [])} />
            <div onDragEnter={enter} onDragOver={(event) => {
                event.preventDefault(); event.stopPropagation();
                event.dataTransfer.dropEffect = running.current ? 'none' : 'copy';
            }} onDragLeave={leave} onDrop={drop}
                className={inline ? 'rounded-md' : 'rounded-lg border border-dashed transition-colors ' +
                    (dragging ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/25' : 'border-border/70 bg-muted/20 hover:bg-muted/40')}>
                <button type="button" disabled={working}
                    className={inline ? 'flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40' :
                        'flex w-full items-center gap-2.5 text-left disabled:opacity-60 ' + (compact ? 'px-3 py-2' : 'p-5')}
                    onClick={() => input.current?.click()}>
                    {inline ? <Upload className="size-3.5" /> :
                        <span className={'grid shrink-0 place-items-center rounded-md bg-background ' + (compact ? 'size-7' : 'size-9')}>
                            {working ? <LoaderCircle className="size-4 animate-spin" /> : <CloudUpload className="size-4 text-muted-foreground" />}
                        </span>}
                    <span className="min-w-0 flex-1">
                        <span className={inline ? '' : 'block text-xs font-semibold'}>
                            {inline ? '+ Attach' : dragging ? 'Drop files to upload' : 'Drop files or choose files'}
                        </span>
                        {!inline && <span className="mt-0.5 block text-[10px] text-muted-foreground">
                            256 KB chunks · up to 1 GB per file
                        </span>}
                    </span>
                </button>
            </div>

            {items.length > 0 && <div className="mt-2 space-y-1.5">
                {items.map((item, index) => <div key={index} className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px]">
                        {item.stage === 'done' ? <CheckCircle2 className="size-3.5 shrink-0 text-green-500" /> :
                            item.stage === 'assembling' ? <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" /> :
                                <Upload className="size-3.5 shrink-0 text-muted-foreground" />}
                        <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
                        <span className="shrink-0 text-muted-foreground">{item.progress}%</span>
                    </div>
                    {item.stage !== 'done' && <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted" role="progressbar"
                        aria-label={'Upload ' + item.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress}>
                        <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: item.progress + '%' }} />
                    </div>}
                </div>)}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <span className="text-muted-foreground">{totalCompleted} / {items.length} finished</span>
                    <div className="flex gap-2">
                        {working && <button type="button" onClick={pause} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                            <Pause className="size-3.5" /> Pause
                        </button>}
                        {!working && current.current < selected.current.length &&
                            <button type="button" onClick={() => void run()} className="inline-flex items-center gap-1 text-foreground">
                                {paused ? <Play className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                                {paused ? 'Resume' : 'Retry'}
                            </button>}
                        {!working && current.current < selected.current.length &&
                            <button type="button" onClick={() => void cancel()} className="inline-flex items-center gap-1 text-muted-foreground hover:text-red-500">
                                <X className="size-3.5" /> Cancel
                            </button>}
                    </div>
                </div>
            </div>}
            {error && <p role="alert" className="mt-2 flex items-start gap-1.5 text-[11px] text-red-500">
                <AlertCircle className="size-3.5 shrink-0" />{error}
            </p>}
            {message && <p role="status" className="mt-2 text-[11px] text-green-600 dark:text-green-400">{message}</p>}
            {!working && error && <p className="mt-1 text-[10px] text-muted-foreground">Resume uses chunks already received by the server. After a page reload, select the same file again.</p>}
        </div>;
    },
);
