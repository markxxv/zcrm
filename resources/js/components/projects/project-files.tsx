import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { FileUp, Grid2X2, List, Download, Pencil, UploadCloud } from 'lucide-react';
import { ProjectFileDialog } from './project-file-dialog';
import { UserAvatar } from '@/components/user-avatar';
import type { Filters, Page, ProjectFile } from '@/types/project';
import { AttachmentIcon, SectionHeader, Paginator, ResourceSearch, FilterSelect, mutedButton, outlineButton, solidButton, bytes, displayDate, useResourceFilters } from './resources';

type Props = { projectId: number; page: Page<ProjectFile> | null; filters: Filters; userId: number; ownerId: number };
export function ProjectFiles({ projectId, page, filters, userId, ownerId }: Props) {
    const { query, setQuery, setFilter } = useResourceFilters(projectId, filters);
    const [grid, setGrid] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [selected, setSelected] = useState<ProjectFile | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const uploadRef = useRef<HTMLInputElement>(null);
    const fileUrl = '/projects/' + projectId + '/files';

    const upload = (selectedFiles: FileList | File[]) => {
        const arr = Array.from(selectedFiles);
        if (!arr.length) return;
        if (arr.length > 10 || arr.some((f) => f.size > 20 * 1024 * 1024)) { window.alert('Maximum 10 files per upload, 20 MB per file.'); return; }
        setUploadProgress(0); setErrors({});
        router.post(fileUrl, { files: arr }, {
            forceFormData: true, preserveScroll: true,
            onProgress: (progress) => setUploadProgress(progress?.percentage ?? 0),
            onError: (e) => setErrors(e),
            onFinish: () => { setUploadProgress(null); if (uploadRef.current) uploadRef.current.value = ''; },
        });
    };
    const edit = (file: ProjectFile) => setSelected(file);
    const download = (file: ProjectFile) => fileUrl + '/' + file.id + '/download';
    const canEdit = (file: ProjectFile) => ownerId === userId || file.uploaded_by === userId;
    return <>
        <SectionHeader title="Project files" subtitle="Private documents and attachments" action={<button className={solidButton} onClick={() => uploadRef.current?.click()}><FileUp className="size-4" /> Upload files</button>} />
        <input ref={uploadRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) upload(e.target.files); }} />
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }} className={'mb-6 flex items-center gap-3 rounded-xl border border-dashed p-5 transition-colors ' + (dragging ? 'border-blue-400 bg-blue-50/50' : 'border-border/70 bg-muted/20')}>
            <UploadCloud className="size-6 text-muted-foreground" />
            <div className="flex-1"><p className="text-xs font-medium">Drop files to upload</p><p className="mt-1 text-[11px] text-muted-foreground">Up to 10 files at once, 20 MB each. Stored privately.</p></div>
            <button className={outlineButton} onClick={() => uploadRef.current?.click()}>Browse</button>
        </div>
        {uploadProgress !== null && <p className="mb-4 text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>}
        {Object.values(errors).length > 0 && <p role="alert" className="mb-4 text-xs text-red-600">{Object.values(errors)[0]}</p>}
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <ResourceSearch query={query} setQuery={setQuery} placeholder="Search name, type, tags or uploader" />
            <FilterSelect value={filters.type} onChange={(type) => setFilter({ type })} options={[{ value: 'all', label: 'All files' }, { value: 'pdf', label: 'PDF' }, { value: 'image', label: 'Images' }, { value: 'document', label: 'Documents' }, { value: 'archive', label: 'Archives' }, { value: 'other', label: 'Other' }]} />
            <FilterSelect value={filters.sort} onChange={(sort) => setFilter({ sort })} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }, { value: 'size', label: 'Largest first' }]} />
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1"><button className={(grid ? '' : 'bg-background shadow-sm ') + 'rounded-md p-1.5'} onClick={() => setGrid(false)} aria-label="List view"><List className="size-4" /></button><button className={(grid ? 'bg-background shadow-sm ' : '') + 'rounded-md p-1.5'} onClick={() => setGrid(true)} aria-label="Grid view"><Grid2X2 className="size-4" /></button></div>
        </div>
        {(page?.data || []).length ? grid ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {page?.data.map((file) => <div key={file.id} className="min-w-0 rounded-xl bg-muted/30 p-3">
                <a href={download(file)} className="mb-3 grid h-28 place-items-center rounded-lg bg-muted/60"><AttachmentIcon file={file} /></a>
                <p className="truncate text-xs font-medium" title={file.name}>{file.name}</p><div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">{file.uploader && <UserAvatar user={file.uploader} className="size-5" />}{bytes(file.size)} · {displayDate(file.created_at)}</div>
                <div className="mt-3 flex justify-between"><a href={download(file)} className={mutedButton}><Download className="size-4" /></a>{canEdit(file) && <button className={mutedButton} onClick={() => edit(file)} aria-label="Edit file"><Pencil className="size-4" /></button>}</div>
            </div>)}
        </div> : <div className="divide-y divide-border/40">
            {page?.data.map((file) => <div key={file.id} className="group flex min-w-0 items-center gap-3 py-3.5">
                <AttachmentIcon file={file} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{file.name}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{(file.tags || []).join(', ') || (file.extension || 'File')}</p></div>
                <span className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">{file.uploader && <UserAvatar user={file.uploader} className="size-6" />}<span>{bytes(file.size)} · {displayDate(file.created_at)}</span></span>
                <a href={download(file)} className={mutedButton} title="Download"><Download className="size-4" /></a>
                {canEdit(file) && <button className={mutedButton} onClick={() => edit(file)} aria-label="Edit file"><Pencil className="size-4" /></button>}
            </div>)}
        </div> : <div className="py-24 text-center text-xs text-muted-foreground">No matching files.</div>}
        <Paginator page={page} />
        <ProjectFileDialog projectId={projectId} file={selected} onOpenChange={(open) => { if (!open) setSelected(null); }} />
    </>;
}
