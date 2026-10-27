import { useRef, useState } from 'react';
import { DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';
import '../../../css/task-due-date-picker.css';
import { addDays, format, isValid, parseISO } from 'date-fns';
import { CalendarDays, ChevronDown } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

type Props = {
    value: string;
    onChange: (date: string) => void;
    disabled?: boolean;
};

function localDate(value: string): Date | undefined {
    if (!value) return undefined;
    const parsed = parseISO(value.slice(0, 10));
    return isValid(parsed) ? parsed : undefined;
}

/** Works inside the Task drawer without shifting the date across timezones. */
export function TaskDueDatePicker({ value, onChange, disabled = false }: Props) {
    const isMobile = useIsMobile();
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState<Date>(() => localDate(value) ?? new Date());
    const [portalContainer, setPortalContainer] = useState<HTMLElement | undefined>();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const selected = localDate(value);

    const handleOpenChange = (next: boolean) => {
        if (next) {
            setMonth(localDate(value) ?? new Date());
            setPortalContainer(triggerRef.current?.closest<HTMLElement>('[data-vaul-drawer]') ?? undefined);
        }
        setOpen(next);
    };

    const choose = (date: Date | undefined) => {
        if (!date || disabled) return;
        onChange(format(date, 'yyyy-MM-dd'));
        setOpen(false);
    };

    const today = new Date();
    const calendar = <div className="w-fit max-w-full">
        <DayPicker
            mode="single"
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            onSelect={choose}
            weekStartsOn={1}
            showOutsideDays
            fixedWeeks
            captionLayout="dropdown"
            navLayout="after"
            startMonth={new Date(1990, 0)}
            endMonth={new Date(today.getFullYear() + 20, 11)}
            className="zcrm-task-calendar"
        />
        <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-border/50 pt-3">
            {[
                { label: 'Today', date: today },
                { label: 'Tomorrow', date: addDays(today, 1) },
                { label: 'Next week', date: addDays(today, 7) },
            ].map(({ label, date }) => <button type="button" key={label}
                className="rounded-md bg-muted/50 px-2.5 py-2 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => choose(date)}>{label}</button>)}
        </div>
    </div>;

    const trigger = <button ref={triggerRef} type="button" disabled={disabled}
        aria-label={value ? 'Change due date' : 'Choose due date'}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-lg bg-muted/45 px-3 py-2.5 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        <span className="flex min-w-0 items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
                {selected ? format(selected, 'EEE, d MMM yyyy') : 'Choose a date'}
            </span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </button>;

    if (isMobile) {
        return <>
            <span onClick={() => { if (!disabled) handleOpenChange(true); }}>{trigger}</span>
            <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
                <DrawerContent className="max-h-[90dvh] overflow-y-auto rounded-t-2xl border-border/50">
                    <DrawerHeader className="px-5 pb-2 pt-5 text-left">
                        <DrawerTitle className="text-sm font-semibold">Due date</DrawerTitle>
                    </DrawerHeader>
                    <div data-vaul-no-drag className="mx-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                        {calendar}
                    </div>
                </DrawerContent>
            </Drawer>
        </>;
    }

    return <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal container={portalContainer}>
            <PopoverPrimitive.Content align="start" side="top" sideOffset={8} collisionPadding={12}
                className="z-[90] w-fit max-w-[calc(100vw-2rem)] rounded-xl border border-border/60 bg-popover p-3.5 text-popover-foreground shadow-2xl outline-none"
                onOpenAutoFocus={(event) => event.preventDefault()}>
                {calendar}
            </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>;
}
