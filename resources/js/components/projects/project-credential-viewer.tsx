import { useEffect, useRef, useState } from 'react';
import { AlignLeft, Check, Copy, Eye, EyeOff, Globe2, KeyRound, Layers3, Server, ShieldCheck, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ProjectAccess } from '@/types/project';
import { ProjectResponsiveDialog } from './project-responsive-dialog';

type Props = {
    access: ProjectAccess | null;
    secret: string | null;
    notes: string | null;
    error: string;
    onClose: () => void;
};

type Detail = {
    id: string;
    label: string;
    value: string;
    icon: LucideIcon;
    sensitive?: boolean;
    multiline?: boolean;
};

export function ProjectCredentialViewer({ access, secret, notes, error, onClose }: Props) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [copyError, setCopyError] = useState('');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setVisible(false);
        setCopied(null);
        setCopyError('');
        if (timer.current) clearTimeout(timer.current);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [access?.id]);

    const copy = async (detail: Detail) => {
        try {
            await navigator.clipboard.writeText(detail.value);
            if (timer.current) clearTimeout(timer.current);
            setCopyError('');
            setCopied(detail.id);
            timer.current = setTimeout(() => {
                setCopied(null);
                timer.current = null;
            }, 2000);
        } catch {
            setCopied(null);
            setCopyError('Could not copy. Check clipboard permissions and try again.');
        }
    };

    const details: Detail[] = access && secret !== null ? [
        { id: 'name', label: 'Service', value: access.name, icon: Server },
        { id: 'category', label: 'Type', value: access.category, icon: Layers3 },
        { id: 'host', label: 'Host / URL', value: access.host || '', icon: Globe2 },
        { id: 'username', label: 'Username', value: access.username || '', icon: UserRound },
        { id: 'secret', label: 'Password / API key', value: secret, icon: KeyRound, sensitive: true },
        { id: 'notes', label: 'Private notes', value: notes || '', icon: AlignLeft, multiline: true },
    ].filter((detail) => detail.value.trim().length > 0) : [];

    return <ProjectResponsiveDialog
        open={access !== null}
        onOpenChange={(open) => { if (!open) onClose(); }}
        icon={ShieldCheck}
        title={access?.name || 'Credential'}
        description="Private credentials · Access is logged"
    >
        <div className="space-y-3">
            {error && <p role="alert" className="rounded-lg bg-red-500/5 p-3 text-xs text-red-500">{error}</p>}
            {access && secret === null && !error && <p role="status" className="py-4 text-xs text-muted-foreground">Decrypting credentials…</p>}
            {details.length > 0 && <div className="space-y-2">
                {details.map((detail) => {
                    const Icon = detail.icon;
                    const wasCopied = copied === detail.id;
                    return <div key={detail.id} className="flex min-w-0 items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
                        <Icon className="mt-1 size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium text-muted-foreground">{detail.label}</p>
                            <p className={'mt-0.5 text-xs text-foreground ' +
                                (detail.multiline ? 'whitespace-pre-wrap break-words' : 'break-all') +
                                (detail.sensitive ? ' font-mono' : '')}>
                                {detail.sensitive && !visible ? '••••••••••••' : detail.value}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {detail.sensitive && <button type="button" aria-label={visible ? 'Hide password' : 'Show password'}
                                aria-pressed={visible}
                                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-background/70 hover:text-foreground"
                                onClick={() => setVisible((state) => !state)}>
                                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>}
                            <button type="button" onClick={() => void copy(detail)}
                                title={wasCopied ? 'Copied' : 'Copy ' + detail.label.toLowerCase()}
                                aria-label={wasCopied ? detail.label + ' copied' : 'Copy ' + detail.label.toLowerCase()}
                                className={'grid size-8 place-items-center rounded-md transition-colors ' +
                                    (wasCopied ? 'text-green-500' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground')}>
                                {wasCopied ? <Check className="size-4" strokeWidth={2.5} /> : <Copy className="size-4" />}
                            </button>
                        </div>
                    </div>;
                })}
            </div>}
            {copyError && <p role="alert" className="text-[11px] text-red-500">{copyError}</p>}
            <p className="px-0.5 text-[11px] text-muted-foreground">
                Copied fields show a green check. Values are cleared from this window when you close it.
            </p>
        </div>
    </ProjectResponsiveDialog>;
}
