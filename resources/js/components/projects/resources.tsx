import { useEffect, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { FileText, Table2, Presentation, HardDrive, Figma, Globe2, FileArchive, FileImage, File, FileSpreadsheet, Search, ChevronDown } from 'lucide-react';
import type { Filters, Page, ProjectFile, ProjectLink } from '@/types/project';
import type { ReactNode } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import type { Person } from '@/types/project';

export const fieldClass = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-xs outline-none focus:border-foreground/40';
export const mutedButton = 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';
export const solidButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-3.5 py-2.5 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40';
export const outlineButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-muted/60 px-3.5 py-2.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40';

export function ServiceIcon({ kind }: { kind: ProjectLink['kind'] }) {
    const styles: Record<ProjectLink['kind'], string> = {
        docs: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
        sheets: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400',
        slides: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
        drive: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
        figma: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
        web: 'bg-muted text-muted-foreground',
    };
    const Icon = ({ docs: FileText, sheets: Table2, slides: Presentation, drive: HardDrive, figma: Figma, web: Globe2 })[kind];
    return <span className={'grid size-10 shrink-0 place-items-center rounded-lg ' + styles[kind]}><Icon className="size-5" strokeWidth={1.7} /></span>;
}

export function AttachmentIcon({ file }: { file: ProjectFile }) {
    const e = (file.extension || '').toLowerCase();
    let Icon = File;
    let color = 'bg-muted text-muted-foreground';
    if (e === 'pdf') { Icon = FileText; color = 'bg-red-50 text-red-500 dark:bg-red-500/15'; }
    else if (['jpg', 'png', 'jpeg', 'webp', 'gif', 'svg', 'avif'].includes(e)) { Icon = FileImage; color = 'bg-blue-50 text-blue-600 dark:bg-blue-500/15'; }
    else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) { Icon = FileArchive; color = 'bg-violet-50 text-violet-500 dark:bg-violet-500/15'; }
    else if (['csv', 'xls', 'xlsx'].includes(e)) { Icon = FileSpreadsheet; color = 'bg-green-50 text-green-600 dark:bg-green-500/15'; }
    return <span className={'grid size-10 shrink-0 place-items-center rounded-lg ' + color}><Icon className="size-5" strokeWidth={1.7} /></span>;
}

export function bytes(value: number) {
    if (value < 1024) return value + ' B';
    if (value < 1048576) return Math.round(value / 1024) + ' KB';
    return (value / 1048576).toFixed(1) + ' MB';
}
export function displayDate(value: string) {
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function domain(value: string) {
    try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return value; }
}
export function Avatar({ user, className = '' }: { user: Person; className?: string }) {
    return <UserAvatar user={user} className={'size-8 ring-2 ring-background ' + className} />;
}
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
    return <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-base font-semibold tracking-tight">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>
        {action}
    </div>;
}
export function Paginator({ page }: { page: Page<unknown> | null }) {
    if (!page || page.last_page <= 1) return null;
    return <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
        <span className="mr-4 text-muted-foreground">Page {page.current_page} of {page.last_page} · {page.total} items</span>
        {page.links.filter((link, index) => index === 0 || index === page.links.length - 1 || (index > 0 && index < page.links.length - 1 && Math.abs(Number(link.label) - page.current_page) < 3)).map((link, i) => (
            link.url ? <Link key={i} preserveScroll href={link.url} className={'rounded-lg px-2.5 py-1.5 ' + (link.active ? 'bg-foreground text-background' : 'bg-muted hover:bg-muted/70')}>
                {link.label.includes('Previous') ? 'Previous' : link.label.includes('Next') ? 'Next' : link.label}
            </Link> : <span key={i} className="px-2 text-muted-foreground">{link.label.includes('Previous') ? 'Previous' : link.label.includes('Next') ? 'Next' : link.label}</span>
        ))}
    </div>;
}
export function useResourceFilters(projectId: number, filters: Filters) {
    const [query, setQuery] = useState(filters.q);
    useEffect(() => { setQuery(filters.q); }, [projectId, filters.tab]);
    useEffect(() => {
        if (query === filters.q) return;
        const timer = window.setTimeout(() => {
            router.get('/projects/' + projectId, { tab: filters.tab, q: query, type: filters.type, sort: filters.sort }, { preserveState: true, preserveScroll: true, replace: true });
        }, 330);
        return () => window.clearTimeout(timer);
    }, [query, filters.q, filters.type, filters.sort, filters.tab, projectId]);
    const setFilter = (changes: Partial<Filters>) => router.get('/projects/' + projectId, { ...filters, q: query, ...changes }, { preserveState: true, preserveScroll: true, replace: true });
    return { query, setQuery, setFilter };
}
export function ResourceSearch({ query, setQuery, placeholder }: { query: string; setQuery: (s: string) => void; placeholder: string }) {
    return <label className="flex min-w-52 flex-1 items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
        <Search className="size-4 text-muted-foreground" /><input className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/75" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
    </label>;
}
export function FilterSelect({ value, onChange, options }: { value: string; onChange: (s: string) => void; options: { value: string; label: string }[] }) {
    return <div className="relative">
        <select className="min-w-28 appearance-none rounded-lg bg-muted/50 py-2.5 pl-3 pr-8 text-xs outline-none" value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 size-3 text-muted-foreground" />
    </div>;
}

export function fileDownloadUrl(projectId: number, file: ProjectFile): string {
    const base = '/projects/' + projectId;
    return file.source === 'task'
        ? base + '/task-files/' + file.id + '/download'
        : base + '/files/' + file.id + '/download';
}

export function fileActionUrl(projectId: number, file: ProjectFile): string {
    const base = '/projects/' + projectId;
    return file.source === 'task'
        ? base + '/task-files/' + file.id
        : base + '/files/' + file.id;
}
