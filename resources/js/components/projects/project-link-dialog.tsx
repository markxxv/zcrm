import { Link2 } from 'lucide-react';
import type { ProjectLink } from '@/types/project';
import { ProjectResponsiveDialog } from './project-responsive-dialog';
import { ProjectLinkForm } from './project-link-form';

type Props = {
    projectId: number;
    open: boolean;
    link: ProjectLink | null;
    suggestions?: string[];
    onOpenChange: (open: boolean) => void;
};

/** Shared editor for Main and Links: dialog on desktop, bottom drawer on mobile. */
export function ProjectLinkDialog({ projectId, open, link, suggestions = [], onOpenChange }: Props) {
    return <ProjectResponsiveDialog open={open} onOpenChange={onOpenChange} icon={Link2}
        title={link ? 'Edit link' : 'Add link'}
        description="Organize project links and pinned documents">
        {open && <ProjectLinkForm projectId={projectId} link={link}
            suggestions={suggestions} onClose={() => onOpenChange(false)} />}
    </ProjectResponsiveDialog>;
}
