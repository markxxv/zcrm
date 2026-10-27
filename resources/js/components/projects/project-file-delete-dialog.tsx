import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { ProjectFile } from '@/types/project';
import { fileActionUrl } from './resources';

type Props = {
    projectId: number;
    file: ProjectFile | null;
    onClose: () => void;
};

export function ProjectFileDeleteDialog({ projectId, file, onClose }: Props) {
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { setError(''); }, [file]);

    const destroy = () => {
        if (!file || processing) return;
        setProcessing(true);
        setError('');

        router.delete(fileActionUrl(projectId, file), {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errors) => {
                setError(Object.values(errors)[0] || 'Could not delete this file.');
            },
            onFinish: () => setProcessing(false),
        });
    };

    return <Dialog open={file !== null} onOpenChange={(open) => { if (!open && !processing) onClose(); }}>
        <DialogContent className="sm:max-w-sm">
            <DialogHeader>
                <DialogTitle className="text-base">Delete file?</DialogTitle>
                <DialogDescription className="break-words">
                    <span className="font-medium text-foreground">{file?.name}</span>
                    {file?.source === 'task'
                        ? <> will be permanently removed from the task <span className="font-medium text-foreground">{file.task_title}</span> and all projects linked to it.</>
                        : ' will be permanently removed from this project.'}
                    {' '}This cannot be undone.
                </DialogDescription>
            </DialogHeader>
            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
            <DialogFooter className="gap-2 sm:gap-2">
                <button type="button" disabled={processing} onClick={onClose}
                    className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50">
                    Cancel
                </button>
                <button type="button" disabled={processing} onClick={destroy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                    <Trash2 className="size-3.5" />
                    {processing ? 'Deleting…' : 'Delete permanently'}
                </button>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}
