import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const projectFieldInput = 'min-w-0 w-full flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-50';

export function ProjectFormField({
    id, title, icon: Icon, error, children, className, multiline = false,
}: {
    id: string;
    title: string;
    icon: LucideIcon;
    error?: string;
    children: ReactNode;
    className?: string;
    multiline?: boolean;
}) {
    return <div className={cn('min-w-0 space-y-1.5', className)}>
        <label htmlFor={id} className="block px-0.5 text-[11px] font-medium text-muted-foreground">{title}</label>
        <div className={cn(
            'flex min-w-0 gap-2.5 rounded-lg bg-muted/45 px-3 py-2.5 transition-colors focus-within:bg-muted/70 focus-within:ring-1 focus-within:ring-foreground/15',
            multiline ? 'items-start' : 'items-center',
            error && 'ring-1 ring-red-500/40',
        )}>
            <Icon className={cn('size-4 shrink-0 text-muted-foreground/75', multiline && 'mt-0.5')} aria-hidden="true" />
            {children}
        </div>
        {error && <p role="alert" className="px-0.5 text-[11px] text-red-500">{error}</p>}
    </div>;
}
