import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProjectLinkForm } from './project-link-form';
import { mutedButton } from './resources';

/** Anchored on desktop, native-feeling bottom drawer on phones. */
export function ProjectQuickLink({ projectId }: { projectId: number }) {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const trigger = <button type="button" className={mutedButton + ' mt-3'} aria-label="Add project link">
        <Plus className="size-4" /> Add link
    </button>;
    const editor = open ? <ProjectLinkForm key={projectId} projectId={projectId} compact onClose={() => setOpen(false)} /> : null;

    if (isMobile) {
        return <Drawer open={open} onOpenChange={setOpen} direction="bottom">
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent className="max-h-[85dvh] overflow-y-auto rounded-t-2xl border-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <DrawerHeader className="px-5 pb-3 pt-5 text-left">
                    <DrawerTitle className="text-base font-medium tracking-tight">Add project link</DrawerTitle>
                </DrawerHeader>
                <div data-vaul-no-drag className="px-5">{editor}</div>
            </DrawerContent>
        </Drawer>;
    }

    return <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="start" side="top" sideOffset={10}
            className="z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-border/50 bg-popover p-4 shadow-xl">
            <p className="mb-3 text-xs font-semibold">Add project link</p>
            {editor}
        </PopoverContent>
    </Popover>;
}
