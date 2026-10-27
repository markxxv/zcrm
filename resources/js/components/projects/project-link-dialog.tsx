import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ProjectLink } from '@/types/project';
import { ProjectLinkForm } from './project-link-form';

type Props = {
    projectId: number;
    open: boolean;
    link: ProjectLink | null;
    onOpenChange: (open: boolean) => void;
};

/** Full editor in the Links tab; same fields and validation as Main. */
export function ProjectLinkDialog({ projectId, open, link, onOpenChange }: Props) {
    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>{link ? 'Edit link' : 'Add link'}</DialogTitle></DialogHeader>
            {open && <ProjectLinkForm projectId={projectId} link={link} onClose={() => onOpenChange(false)} />}
        </DialogContent>
    </Dialog>;
}
