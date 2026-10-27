import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

export function ProjectResponsiveDialog({
    open, onOpenChange, title, description, icon: Icon, children, disabled = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    icon: LucideIcon;
    children: ReactNode;
    disabled?: boolean;
}) {
    const mobile = useIsMobile();
    const change = (next: boolean) => { if (!disabled || next) onOpenChange(next); };

    const header = <div className="flex items-center gap-3 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
            <Icon className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
            {mobile
                ? <>
                    <DrawerTitle className="text-sm font-semibold tracking-tight">{title}</DrawerTitle>
                    <DrawerDescription className="mt-1 text-[11px] leading-normal">{description}</DrawerDescription>
                </>
                : <>
                    <DialogTitle className="text-sm font-semibold tracking-tight">{title}</DialogTitle>
                    <DialogDescription className="mt-1 text-[11px] leading-normal">{description}</DialogDescription>
                </>}
        </div>
    </div>;

    if (mobile) {
        return <Drawer open={open} onOpenChange={change} direction="bottom">
            <DrawerContent className="max-h-[92dvh] rounded-t-2xl border-border/40">
                <div data-vaul-no-drag className="min-h-0 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
                    <DrawerHeader className="mb-5 p-0 text-left">{header}</DrawerHeader>
                    {children}
                </div>
            </DrawerContent>
        </Drawer>;
    }

    return <Dialog open={open} onOpenChange={change}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-border/50 p-5 shadow-2xl sm:max-w-[460px] sm:p-6">
            <DialogHeader className="mb-2 text-left">{header}</DialogHeader>
            {children}
        </DialogContent>
    </Dialog>;
}
