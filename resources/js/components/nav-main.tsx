import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useActiveUrl } from '@/hooks/use-active-url';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Fragment, type ReactNode } from 'react';

export function NavMain({ items = [], projectAction, projectList }: { items: NavItem[]; projectAction?: ReactNode; projectList?: ReactNode }) {
    const { urlIsActive } = useActiveUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <Fragment key={item.title}>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={urlIsActive(item.href)}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                            {item.title === 'Projects' && projectAction}
                        </SidebarMenuItem>
                        {item.title === 'Projects' && projectList && (
                            <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                                {projectList}
                            </SidebarMenuItem>
                        )}
                    </Fragment>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
