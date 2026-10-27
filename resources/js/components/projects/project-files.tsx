import { useRef, useState } from 'react';
import { FileUp, Grid2X2, List, Download, Pencil, Trash2 } from 'lucide-react';
import { ProjectFileDialog } from './project-file-dialog';
import { ProjectFileDeleteDialog } from './project-file-delete-dialog';
import { ProjectFileRow } from './project-file-row';
import { ProjectFileUploader, type ProjectFileUploaderHandle } from './project-file-uploader';
import { UserAvatar } from '@/components/user-avatar';
import type { Filters, Page, ProjectFile } from '@/types/project';
import { AttachmentIcon, SectionHeader, Paginator, ResourceSearch, FilterSelect, mutedButton, outlineButton, solidButton, bytes, displayDate, useResourceFilters, fileDownloadUrl } from './resources';

type Props = { projectId: number; page: Page<ProjectFile> | null; filters: Filters; suggestions: string[] };
export function ProjectFiles({ projectId, page, filters, suggestions }: Props) {
    const { query, setQuery, setFilter } = useResourceFilters(projectId, filters);
    const [grid, setGrid] = useState(false);
    const [selected, setSelected] = useState<ProjectFile | null>(null);
    const [deleting, setDeleting] = useState<ProjectFile | null>(null);
    const uploadRef = useRef<ProjectFileUploaderHandle>(null);

    const edit = (file: ProjectFile) => setSelected(file);
    const download = (file: ProjectFile) => fileDownloadUrl(projectId, file);
    const canEdit = (file: ProjectFile) => file.can_edit;
    return <>
        <SectionHeader title="Project files" subtitle="Private documents and attachments" action={<button className={solidButton} onClick={() => uploadRef.current?.browse()}><FileUp className="size-4" /> Upload files</button>} />
        <ProjectFileUploader ref={uploadRef} projectId={projectId} />
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <ResourceSearch query={query} setQuery={setQuery} placeholder="Search name, type, tags or uploader" />
            <FilterSelect value={filters.type} onChange={(type) => setFilter({ type })} options={[{ value: 'all', label: 'All files' }, { value: 'pdf', label: 'PDF' }, { value: 'image', label: 'Images' }, { value: 'document', label: 'Documents' }, { value: 'archive', label: 'Archives' }, { value: 'other', label: 'Other' }]} />
            <FilterSelect value={filters.sort} onChange={(sort) => setFilter({ sort })} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }, { value: 'size', label: 'Largest first' }]} />
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1"><button className={(grid ? '' : 'bg-background shadow-sm ') + 'rounded-md p-1.5'} onClick={() => setGrid(false)} aria-label="List view"><List className="size-4" /></button><button className={(grid ? 'bg-background shadow-sm ' : '') + 'rounded-md p-1.5'} onClick={() => setGrid(true)} aria-label="Grid view"><Grid2X2 className="size-4" /></button></div>
        </div>
        {(page?.data || []).length ? grid ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {page?.data.map((file) => <div key={file.id} className="min-w-0 rounded-xl bg-muted/30 p-3">
                <a href={download(file)} className="mb-3 grid h-28 place-items-center rounded-lg bg-muted/60"><AttachmentIcon file={file} projectId={projectId} grid /></a>
                <p className="truncate text-xs font-medium" title={file.name}>{file.name}</p>
                <p className="mt-1 truncate text-[10px] text-muted-foreground" title={file.task_title || 'Project file'}>{file.task_title ? 'Task: ' + file.task_title : 'Project file'}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">{file.uploader && <UserAvatar user={file.uploader} className="size-5" />}{bytes(file.size)} · {displayDate(file.created_at)}</div>
                <div className="mt-3 flex items-center justify-between gap-1">
                    <a href={download(file)} className={mutedButton} aria-label={'Download ' + file.name}><Download className="size-4" /></a>
                    {canEdit(file) && <div className="flex items-center gap-1">
                        <button type="button" className={mutedButton} onClick={() => edit(file)} aria-label={'Edit ' + file.name}><Pencil className="size-4" /></button>
                        <button type="button" className={mutedButton + ' hover:text-red-500'} onClick={() => setDeleting(file)} aria-label={'Delete ' + file.name}><Trash2 className="size-4" /></button>
                    </div>}
                </div>
            </div>)}
        </div> : <div className="divide-y divide-border/40">
            {page?.data.map((file) => <ProjectFileRow key={file.id} projectId={projectId} file={file}
                canEdit={canEdit(file)} onEdit={edit} onDelete={setDeleting} />)}
        </div> : <div className="py-24 text-center text-xs text-muted-foreground">No matching files.</div>}
        <Paginator page={page} />
        <ProjectFileDialog projectId={projectId} file={selected} suggestions={suggestions} onOpenChange={(open) => { if (!open) setSelected(null); }} onDelete={(file) => { setSelected(null); setDeleting(file); }} />
        <ProjectFileDeleteDialog projectId={projectId} file={deleting} onClose={() => setDeleting(null)} />
    </>;
}
