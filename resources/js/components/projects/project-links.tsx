import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Plus, Pencil, ArrowUpRight, Pin } from 'lucide-react';
import { ProjectLinkDialog } from './project-link-dialog';
import type { Filters, Page, ProjectLink } from '@/types/project';
import { ServiceIcon, SectionHeader, Paginator, ResourceSearch, FilterSelect, mutedButton, solidButton, domain, displayDate, useResourceFilters } from './resources';

type Props = { projectId: number; page: Page<ProjectLink> | null; filters: Filters };

export function ProjectLinks({ projectId, page, filters }: Props) {
    const { query, setQuery, setFilter } = useResourceFilters(projectId, filters);
    const [opened, setOpened] = useState(false);
    const [active, setActive] = useState<ProjectLink | null>(null);
    const open = (link: ProjectLink | null) => { setActive(link); setOpened(true); };
    return <>
        <SectionHeader title="Project links" subtitle="Documents, shared folders and external resources" action={<button className={solidButton} onClick={() => open(null)}><Plus className="size-4" /> Add link</button>} />
        <div className="mb-6 flex flex-wrap gap-2">
            <ResourceSearch query={query} setQuery={setQuery} placeholder="Search by name, URL, category or notes" />
            <FilterSelect value={filters.type} onChange={(type) => setFilter({ type })} options={[
                { value: 'all', label: 'All types' }, { value: 'docs', label: 'Google Docs' }, { value: 'sheets', label: 'Google Sheets' }, { value: 'slides', label: 'Google Slides' }, { value: 'drive', label: 'Google Drive' }, { value: 'figma', label: 'Figma' }, { value: 'web', label: 'Other' },
            ]} />
            <FilterSelect value={filters.sort} onChange={(sort) => setFilter({ sort })} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }]} />
        </div>
        {(page?.data || []).length ? <div className="divide-y divide-border/40">
            {page?.data.map((link) => <div key={link.id} className="group flex min-w-0 items-center gap-3 py-3.5">
                <ServiceIcon kind={link.kind} />
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 truncate text-xs font-semibold hover:text-blue-600">{link.title} {link.pinned && <Pin className="size-3 shrink-0 text-muted-foreground" />}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{domain(link.url)} · {link.category || 'General'}</span>
                </a>
                <span className="hidden text-[11px] text-muted-foreground sm:block">{displayDate(link.created_at)}</span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className={mutedButton} aria-label="Open link"><ArrowUpRight className="size-4" /></a>
                <button className={mutedButton} onClick={() => open(link)} aria-label={'Edit ' + link.title}><Pencil className="size-4" /></button>
            </div>)}
        </div> : <div className="py-24 text-center text-xs text-muted-foreground">No links found.</div>}
        <Paginator page={page} />
        <ProjectLinkDialog projectId={projectId} open={opened} link={active} onOpenChange={setOpened} />
    </>;
}
