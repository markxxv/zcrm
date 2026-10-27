import { forwardRef } from 'react';
import { router } from '@inertiajs/react';
import { ChunkUploader, type ChunkUploaderHandle } from '@/components/files/chunk-uploader';

export type ProjectFileUploaderHandle = ChunkUploaderHandle;

type Props = { projectId: number; compact?: boolean };

/** The same resumable upload engine is used in Projects and Tasks. */
export const ProjectFileUploader = forwardRef<ProjectFileUploaderHandle, Props>(
    function ProjectFileUploader({ projectId, compact = false }, ref) {
        return <ChunkUploader
            ref={ref}
            key={'project-' + projectId}
            scope="project"
            targetId={projectId}
            mode={compact ? 'compact' : 'full'}
            onUploaded={() => router.reload({ only: ['recentFiles', 'files', 'counts'] })}
        />;
    },
);
