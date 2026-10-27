import type { Task, TaskProject } from '@/types/task';

export interface Person { id: number; name: string; email: string; avatar: string | null }
export interface Project extends TaskProject {
    description: string | null;
    status: 'active' | 'paused' | 'archived';
    created_by: number;
    members: Person[];
}
export interface ProjectLink {
    id: number; project_id: number; title: string; url: string;
    kind: 'docs' | 'sheets' | 'slides' | 'drive' | 'figma' | 'web';
    category: string | null; notes: string | null; pinned: boolean;
    created_at: string;
}
export interface ProjectFile {
    id: number; name: string; mime_type: string | null; extension: string | null;
    size: number; tags: string[] | null; uploaded_by: number;
    created_at: string; uploader: Person;
}
export interface ProjectAccess {
    id: number; name: string; category: 'Hosting' | 'Database' | 'DNS' | 'Other';
    host: string | null; username: string | null; created_at: string;
}
export interface Page<T> {
    data: T[]; current_page: number; last_page: number;
    total: number; links: { url: string | null; label: string; active: boolean }[];
}
export interface Filters {
    tab: 'main' | 'files' | 'links' | 'access';
    q: string; type: string; sort: string;
}
export interface ProjectShowProps {
    project: Project;
    tasks: Task[];
    pinnedLinks: ProjectLink[];
    recentFiles: ProjectFile[];
    files: Page<ProjectFile> | null;
    links: Page<ProjectLink> | null;
    accesses: Page<ProjectAccess> | null;
    availableUsers: Person[];
    availableProjects: TaskProject[];
    counts: { files: number; links: number };
    filters: Filters;
    canManage: boolean;
    canAccessVault: boolean;
}
