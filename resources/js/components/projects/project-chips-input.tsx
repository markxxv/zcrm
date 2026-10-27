import { useRef, useState, type KeyboardEvent } from 'react';
import { Plus, Tag, X } from 'lucide-react';

export function normalizedChips(values: string[], maxItems: number, maxLength: number): string[] {
    const seen = new Set<string>();
    return values.flatMap((raw) => raw.split(',')).map((raw) => raw.trim()).filter((value) => {
        const key = value.toLocaleLowerCase();
        if (!value || value.length > maxLength || seen.has(key) || seen.size >= maxItems) return false;
        seen.add(key);
        return true;
    });
}

type Props = {
    id: string;
    label: string;
    values: string[];
    onChange: (values: string[]) => void;
    draft: string;
    onDraftChange: (draft: string) => void;
    suggestions?: string[];
    multiple?: boolean;
    maxItems?: number;
    maxLength?: number;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
};

/** Inline tag/category chips with free typing, suggestions and keyboard support. */
export function ProjectChipsInput({
    id, label, values, onChange, draft, onDraftChange, suggestions = [],
    multiple = true, maxItems = 20, maxLength = 40, placeholder = 'Add tag…',
    disabled = false, error,
}: Props) {
    const input = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const limit = multiple ? maxItems : 1;
    const canAdd = values.length < limit;
    const matches = normalizedChips(suggestions, 100, maxLength)
        .filter((value) => !values.some((selected) => selected.toLocaleLowerCase() === value.toLocaleLowerCase()))
        .filter((value) => !draft || value.toLocaleLowerCase().includes(draft.trim().toLocaleLowerCase()))
        .slice(0, 5);

    function commit(value: string) {
        const next = normalizedChips([...values, value], limit, maxLength);
        if (next.length !== values.length) onChange(next);
        onDraftChange('');
    }

    function keyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            if (draft.trim()) commit(draft);
            else if (matches[0] && event.key === 'Enter') commit(matches[0]);
        } else if (event.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1));
        } else if (event.key === 'Escape') {
            setFocused(false);
            input.current?.blur();
        } else if (event.key === 'Tab' && draft.trim()) {
            commit(draft);
        }
    }

    return <div className="min-w-0 space-y-1.5">
        <label htmlFor={id} className="block px-0.5 text-[11px] font-medium text-muted-foreground">{label}</label>
        <div className={'relative rounded-lg bg-muted/45 transition-colors focus-within:bg-muted/70 focus-within:ring-1 focus-within:ring-foreground/15 ' + (error ? 'ring-1 ring-red-500/40' : '')}>
            <div className="flex min-h-10 min-w-0 flex-wrap items-center gap-1.5 px-3 py-2" onClick={() => input.current?.focus()}>
                <Tag className="mr-1 size-4 shrink-0 text-muted-foreground/75" aria-hidden />
                {values.map((value) => <span key={value} className="inline-flex max-w-full items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground">
                    <span className="max-w-48 truncate">{value}</span>
                    <button type="button" disabled={disabled} className="shrink-0 rounded text-muted-foreground hover:text-foreground disabled:opacity-40"
                        onClick={(event) => { event.stopPropagation(); onChange(values.filter((v) => v !== value)); input.current?.focus(); }}
                        aria-label={'Remove ' + value}><X className="size-3" /></button>
                </span>)}
                {canAdd && <input id={id} ref={input} value={draft} autoComplete="off"
                    maxLength={maxLength} disabled={disabled}
                    className="min-w-24 flex-1 bg-transparent py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/55"
                    placeholder={values.length ? (multiple ? 'Add more…' : '') : placeholder}
                    onChange={(event) => onDraftChange(event.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { if (draft.trim()) commit(draft); setFocused(false); }}
                    onKeyDown={keyDown}
                    aria-invalid={Boolean(error)} aria-autocomplete="list" />}
                {canAdd && draft.trim() && <button type="button" disabled={disabled}
                    className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Add tag"
                    onMouseDown={(e) => e.preventDefault()} onClick={() => commit(draft)}><Plus className="size-3.5" /></button>}
            </div>
            {focused && canAdd && matches.length > 0 && !disabled && <div role="listbox" aria-label="Suggestions"
                className="absolute inset-x-0 top-full z-30 mt-1 max-h-44 overflow-y-auto rounded-lg border border-border/50 bg-popover p-1 shadow-xl">
                {matches.map((value) => <button key={value} role="option" aria-selected={false}
                    type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { commit(value); input.current?.focus(); }}
                    className="block w-full truncate rounded-md px-2.5 py-2 text-left text-xs text-foreground hover:bg-muted">{value}</button>)}
            </div>}
        </div>
        {error && <p role="alert" className="px-0.5 text-[11px] text-red-500">{error}</p>}
    </div>;
}
