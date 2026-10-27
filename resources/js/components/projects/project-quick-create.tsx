import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarMenuAction } from '@/components/ui/sidebar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProjectCreateForm } from './project-create-form';

export function ProjectQuickCreate() {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);

    const trigger = <SidebarMenuAction type="button" title="New project" aria-label="Create project"
        className="top-1/2 -translate-y-1/2 peer-data-[size=default]/menu-button:top-1/2 size-7 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        <Plus className="size-4" />
    </SidebarMenuAction>;

    const editor = open
        ? <ProjectCreateForm compact onClose={() => setOpen(false)} />
        : null;

    if (isMobile) {
        return <Drawer open={open} onOpenChange={setOpen} direction="bottom">
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent className="max-h-[85dvh] overflow-y-auto rounded-t-2xl border-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <DrawerHeader className="px-5 pb-3 pt-5 text-left">
                    <DrawerTitle className="text-base font-medium tracking-tight">New project</DrawerTitle>
                </DrawerHeader>
                <div data-vaul-no-drag className="px-5">{editor}</div>
            </DrawerContent>
        </Drawer>;
    }

    return <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="start" side="right" sideOffset={12}
            className="z-50 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-border/50 bg-popover p-4 shadow-xl">
            <p className="mb-3 text-xs font-semibold">New project</p>
            {editor}
        </PopoverContent>
    </Popover>;
}
