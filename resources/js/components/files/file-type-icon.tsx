import { File, FileImage } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
    name: string;
    extension?: string | null;
    size?: 'normal' | 'compact' | 'inline' | 'grid';
    thumbnailUrl?: string;
};

type MaterialIcon = { name: string; svg: string };
type IconData = { key: string; src: string };

const rasterExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']);
const imageExtensions = new Set([
    ...rasterExtensions, 'heic', 'heif', 'bmp', 'tif', 'tiff', 'svg', 'ico',
]);

// Keep the 377-icon library out of the initial JS bundle.
let iconLibrary: Promise<typeof import('material-file-icons')> | undefined;
const iconUrls = new Map<string, string>();

function materialIcon(filename: string): Promise<string> {
    iconLibrary ??= import('material-file-icons');
    return iconLibrary.then(({ getIcon }) => {
        const icon: MaterialIcon = getIcon(filename);
        let url = iconUrls.get(icon.name);
        if (!url) {
            // Render the trusted library SVG as an <img>, without inline SVG/HTML.
            url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(icon.svg);
            iconUrls.set(icon.name, url);
        }
        return url;
    });
}

function fileExtension(name: string, extension?: string | null): string {
    const provided = extension?.trim().replace(/^\./, '').toLowerCase();
    if (provided) return provided;
    const basename = name.toLowerCase().split('/').pop() || '';
    return basename.includes('.') ? basename.split('.').pop() || '' : '';
}

/** One shared icon for Projects, Recent files and Tasks; images retain private WebP previews. */
export function FileTypeIcon({ name, extension, size = 'normal', thumbnailUrl }: Props) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const [material, setMaterial] = useState<IconData | null>(null);

    const ext = fileExtension(name, extension);
    const isImage = imageExtensions.has(ext);
    const key = name.toLowerCase();
    const filename = name.includes('.') || !ext ? name : name + '.' + ext;
    const preview = rasterExtensions.has(ext) && thumbnailUrl && failedUrl !== thumbnailUrl
        ? thumbnailUrl : null;

    useEffect(() => {
        if (isImage) return;
        let active = true;
        materialIcon(filename).then((src) => {
            if (active) setMaterial({ key, src });
        }).catch(() => {
            if (active) setMaterial(null);
        });
        return () => { active = false; };
    }, [filename, key, isImage]);

    const inline = size === 'inline';
    const grid = size === 'grid';
    const compact = size === 'compact';
    const outerSize = grid ? 'size-10 rounded-lg' : inline ? 'size-5 rounded' :
        compact ? 'size-8 rounded-md' : 'size-10 rounded-lg';
    const innerSize = inline ? 'size-4' : compact ? 'size-6' : grid ? 'size-8' : 'size-7';

    if (preview) {
        return <span className={'block shrink-0 overflow-hidden rounded-md bg-muted ' +
            (grid ? 'h-full w-full' : outerSize)}>
            <img src={preview} alt="" draggable={false} loading="lazy" decoding="async"
                width={128} height={128} className="h-full w-full object-cover"
                onError={() => setFailedUrl(preview)} />
        </span>;
    }

    const materialSrc = !isImage && material?.key === key ? material.src : null;
    const FallbackIcon = isImage ? FileImage : File;

    return <span aria-hidden="true" title={ext ? ext.toUpperCase() + ' file' : 'File'}
        className={'grid shrink-0 place-items-center ' + outerSize +
            (isImage ? ' bg-sky-500/10 text-sky-600 dark:text-sky-400' : '')}>
        {materialSrc
            ? <img src={materialSrc} alt="" width={32} height={32}
                loading="lazy" decoding="async" draggable={false} className={innerSize + ' object-contain'} />
            : <FallbackIcon className={innerSize + ' text-muted-foreground'} strokeWidth={1.7} />}
    </span>;
}
