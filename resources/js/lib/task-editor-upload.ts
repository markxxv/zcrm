/**
 * Inline image uploads use the same resumable 256 KiB protocol as task and project files.
 * No image data is sent in a request larger than the server's 2 MB limit.
 */
type Session = {
    id: string;
    chunk_size: number;
    total_chunks: number;
    received: number[];
    assembled_chunks: number;
    status: string;
    result_id: number | null;
};

function csrf(): Record<string, string> {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith('XSRF-TOKEN='));
    if (cookie) return { 'X-XSRF-TOKEN': decodeURIComponent(cookie.slice(11)) };
    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    return meta ? { 'X-CSRF-TOKEN': meta } : {};
}

async function json<T>(path: string, method: string, body?: FormData | object, signal?: AbortSignal): Promise<T> {
    const multipart = body instanceof FormData;
    const response = await fetch(path, {
        method, signal, credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...csrf(),
            ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? multipart ? body : JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const validation = payload?.errors ? Object.values(payload.errors).flat()[0] : null;
        throw new Error(typeof validation === 'string' ? validation : payload?.message || 'Upload failed (' + response.status + ').');
    }
    return response.json() as Promise<T>;
}

async function hash(bytes: ArrayBuffer | Uint8Array): Promise<string> {
    const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const digest = await crypto.subtle.digest('SHA-256', buffer as BufferSource);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function uploadTaskEditorImage(
    file: File,
    taskId: number,
    onProgress: (value: number) => void,
    signal: AbortSignal,
): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        throw new Error('Choose a JPG, PNG, GIF or WebP image.');
    }
    if (!file.size || file.size > 24 * 1024 * 1024) {
        throw new Error('Image must be smaller than 24 MB.');
    }
    if (!crypto.subtle) throw new Error('Secure HTTPS connection required for uploads.');

    const clientKey = await hash(new TextEncoder().encode(JSON.stringify([
        'task-editor-image', taskId, file.name, file.size, file.lastModified,
    ])));
    const storageKey = 'zcrm:chunk:' + clientKey;
    let resumeId: string | null = null;
    try { resumeId = localStorage.getItem(storageKey); } catch { /* storage disabled */ }

    const state = await json<Session>('/uploads/start', 'POST', {
        target_type: 'task',
        target_id: taskId,
        name: file.name,
        size: file.size,
        mime_type: file.type,
        client_key: clientKey,
        ...(resumeId ? { resume_id: resumeId } : {}),
    }, signal);
    try { localStorage.setItem(storageKey, state.id); } catch { /* optional */ }
    const base = '/uploads/' + state.id;
    let fileId: number | null = null;
    try {
        if (state.status === 'completed') {
            fileId = state.result_id;
        } else {
            const received = new Set(state.received);
            const missing = Array.from({ length: state.total_chunks }, (_, i) => i).filter((i) => !received.has(i));
            let done = state.received.reduce((total, i) => total + Math.min(
                state.chunk_size, file.size - i * state.chunk_size
            ), 0);
            let cursor = 0;

            await Promise.all(Array.from({ length: Math.min(3, missing.length) }, async () => {
                while (cursor < missing.length) {
                    if (signal.aborted) throw new DOMException('Upload cancelled', 'AbortError');
                    const index = missing[cursor++];
                    const part = file.slice(index * state.chunk_size, Math.min((index + 1) * state.chunk_size, file.size));
                    const bytes = await part.arrayBuffer();
                    const form = new FormData();
                    form.append('chunk', new Blob([bytes]), 'chunk.part');
                    form.append('sha256', await hash(bytes));

                    for (let attempt = 0; attempt < 3; attempt++) {
                        try {
                            await json(base + '/chunks/' + index, 'POST', form, signal);
                            break;
                        } catch (error) {
                            if (signal.aborted || attempt === 2) throw error;
                        }
                    }

                    done += part.size;
                    onProgress(Math.round(done / file.size * 90));
                }
            }));

            let assembled = state.assembled_chunks;
            while (assembled < state.total_chunks) {
                const reply = await json<{ assembled_chunks: number }>(base + '/assemble', 'POST', {}, signal);
                if (reply.assembled_chunks <= assembled) throw new Error('Could not assemble image.');
                assembled = reply.assembled_chunks;
                onProgress(90 + Math.round(assembled / state.total_chunks * 8));
            }

            const result = await json<{ file: { id: number } }>(base + '/complete', 'POST', {}, signal);
            fileId = result.file.id;
        }
        if (!fileId) throw new Error('Missing uploaded image reference.');

        onProgress(98);
        const converted = await json<{ url: string }>(
            '/tasks/' + taskId + '/files/' + fileId + '/editor-image', 'POST', {}, signal
        );
        try { localStorage.removeItem(storageKey); } catch { /* optional */ }
        onProgress(100);
        return converted.url;
    } catch (error) {
        // Once assembled, a failed conversion should not leave a full original on disk.
        // An incomplete session is cleaned by the existing uploads:prune command.
        if (fileId) {
            try {
                await fetch('/tasks/' + taskId + '/files/' + fileId, {
                    method: 'DELETE', credentials: 'same-origin',
                    headers: { Accept: 'application/json', ...csrf() },
                });
            } catch { /* best effort */ }
        }
        throw error;
    }
}
