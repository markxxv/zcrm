import { File, FileImage } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';

type Props = {
    name: string;
    extension?: string | null;
    size?: 'normal' | 'compact' | 'inline' | 'grid';
    thumbnailUrl?: string;
};

type FileIconComponent = ComponentType<{
    size?: number;
    variant?: 'filled' | 'outlined' | 'colored';
    className?: string;
}>;
type ResolvedIcon = { key: string; icon: FileIconComponent | null };

const rasterExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']);
const imageExtensions = new Set([
    ...rasterExtensions, 'heic', 'heif', 'bmp', 'tif', 'tiff', 'svg', 'ico',
]);

// Avoid loading the file icon library on screens with no file attachments.
let iconLibrary: Promise<typeof import('@nice2dev/icons-filetypes')> | undefined;

function fileExtension(name: string, extension?: string | null): string {
    const provided = extension?.trim().replace(/^\./, '').toLowerCase();
    if (provided) return provided;
    const basename = name.toLowerCase().split('/').pop() || '';
    return basename.includes('.') ? basename.split('.').pop() || '' : '';
}

async function getFileIcon(extension: string): Promise<FileIconComponent | null> {
    iconLibrary ??= import('@nice2dev/icons-filetypes');
    const library = await iconLibrary;
    const name = library.FILE_TYPE_ICONS[extension as keyof typeof library.FILE_TYPE_ICONS];
    if (!name) return null;
    const component = (library as unknown as Record<string, FileIconComponent | undefined>)[name];
    return component || null;
}

/** Shared format icons for Projects, Recent files and Tasks; raster images retain private WebP thumbnails. */
export function FileTypeIcon({ name, extension, size = 'normal', thumbnailUrl }: Props) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const [resolved, setResolved] = useState<ResolvedIcon | null>(null);

    const ext = fileExtension(name, extension);
    const isImage = imageExtensions.has(ext);
    const preview = rasterExtensions.has(ext) && thumbnailUrl && failedUrl !== thumbnailUrl
        ? thumbnailUrl : null;

    useEffect(() => {
        if (isImage || !ext) return;
        let active = true;
        getFileIcon(ext).then((icon) => {
            if (active) setResolved({ key: ext, icon });
        }).catch(() => {
            if (active) setResolved({ key: ext, icon: null });
        });
        return () => { active = false; };
    }, [ext, isImage]);

    const inline = size === 'inline';
    const grid = size === 'grid';
    const compact = size === 'compact';
    const outerSize = grid ? 'size-10 rounded-lg' : inline ? 'size-5 rounded' :
        compact ? 'size-8 rounded-md' : 'size-10 rounded-lg';
    const iconSize = inline ? 20 : compact ? 30 : grid ? 36 : 38;

    if (preview) {
        return <span className={'block shrink-0 overflow-hidden rounded-md bg-muted ' +
            (grid ? 'h-full w-full' : outerSize)}>
            <img src={preview} alt="" draggable={false} loading="lazy" decoding="async"
                width={128} height={128} className="h-full w-full object-cover"
                onError={() => setFailedUrl(preview)} />
        </span>;
    }

    const Icon = !isImage && resolved?.key === ext ? resolved.icon : null;
    const Fallback = isImage ? FileImage : File;

    return <span aria-hidden="true" title={ext ? ext.toUpperCase() + ' file' : 'File'}
        className={'grid shrink-0 place-items-center ' + outerSize}>
        {Icon
            ? <Icon size={iconSize} variant="colored" />
            : <Fallback className={(inline ? 'size-4' : compact ? 'size-5' : 'size-6') + ' text-muted-foreground'} strokeWidth={1.7} />}
    </span>;
}
