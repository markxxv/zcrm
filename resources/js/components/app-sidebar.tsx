import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { ProjectQuickCreate } from '@/components/projects/project-quick-create';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CheckSquare, FolderKanban, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
    { title: 'Tasks', href: '/tasks', icon: CheckSquare },
    { title: 'Projects', href: '/projects', icon: FolderKanban },
];

type SidebarProject = { id: number; name: string; status: string };

export function AppSidebar() {
    const { projectNav = [] } = usePage<SharedData & { projectNav?: SidebarProject[] }>().props;
    const currentPath = usePage().url.split('?')[0];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch><AppLogo /></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={mainNavItems} projectAction={<ProjectQuickCreate />} />
                {projectNav.length > 0 && (
                    <div className="group-data-[collapsible=icon]:hidden space-y-0.5 px-5 pt-1">
                        {projectNav.map((project) => (
                            <Link key={project.id} href={'/projects/' + project.id}
                                className={'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-sidebar-accent ' +
                                (currentPath === '/projects/' + project.id ? 'font-medium text-sidebar-foreground' : 'text-muted-foreground')}>
                                <span className={'size-1.5 shrink-0 rounded-full ' + (project.status === 'active' ? 'bg-green-500' : project.status === 'paused' ? 'bg-amber-500' : 'bg-muted-foreground/50')} />
                                <span className="truncate">{project.name}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </SidebarContent>
            <SidebarFooter><NavFooter items={[]} className="mt-auto" /><NavUser /></SidebarFooter>
        </Sidebar>
    );
}
