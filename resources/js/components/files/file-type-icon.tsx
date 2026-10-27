import {
    Braces, Database, File, FileArchive, FileAudio, FileCode2, FileImage,
    FileJson, FileSpreadsheet, FileText, FileVideo, Presentation, Terminal,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

type FileAppearance = {
    label?: string;
    icon: LucideIcon;
    colors: string;
};

type Props = {
    name: string;
    extension?: string | null;
    size?: 'normal' | 'compact' | 'inline' | 'grid';
    thumbnailUrl?: string;
};

const word = 'bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-400';
const excel = 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400';
const powerpoint = 'bg-orange-500/10 text-orange-700 dark:bg-orange-400/15 dark:text-orange-400';
const purple = 'bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-400';
const neutral = 'bg-muted text-muted-foreground';
const blue = 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-400';
const gold = 'bg-amber-400/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400';
const red = 'bg-red-500/10 text-red-600 dark:bg-red-400/15 dark:text-red-400';
const teal = 'bg-teal-500/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-400';
const slate = 'bg-slate-500/10 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300';

const types: Record<string, FileAppearance> = {};

function add(extensions: string[], appearance: FileAppearance) {
    for (const extension of extensions) types[extension] = appearance;
}

// Microsoft Office and OpenDocument
add(['doc', 'docx', 'docm', 'dot', 'dotx', 'odt', 'rtf'], { label: 'W', icon: FileText, colors: word });
add(['xls', 'xlsx', 'xlsm', 'xlsb', 'ods', 'numbers'], { label: 'X', icon: FileSpreadsheet, colors: excel });
add(['ppt', 'pptx', 'pptm', 'odp', 'key', 'keynote'], { label: 'P', icon: Presentation, colors: powerpoint });
add(['csv', 'tsv'], { label: 'CSV', icon: FileSpreadsheet, colors: excel });
add(['pdf'], { label: 'PDF', icon: FileText, colors: red });

// Development: recognizable abbreviation marks and approximate brand palettes.
add(['md', 'markdown', 'mdx'], { label: 'MD', icon: FileCode2, colors: slate });
add(['php', 'phtml', 'blade'], { label: 'PHP', icon: FileCode2, colors: purple });
add(['js', 'mjs', 'cjs'], { label: 'JS', icon: FileCode2, colors: gold });
add(['jsx'], { label: 'JSX', icon: FileCode2, colors: teal });
add(['ts', 'mts', 'cts'], { label: 'TS', icon: FileCode2, colors: blue });
add(['tsx'], { label: 'TSX', icon: FileCode2, colors: blue });
add(['py', 'pyw', 'ipynb'], { label: 'PY', icon: FileCode2, colors: blue });
add(['html', 'htm'], { label: 'HTML', icon: FileCode2, colors: powerpoint });
add(['css', 'scss', 'sass', 'less'], { label: 'CSS', icon: FileCode2, colors: blue });
add(['vue'], { label: 'V', icon: FileCode2, colors: excel });
add(['svelte'], { label: 'S', icon: FileCode2, colors: powerpoint });
add(['json', 'jsonc', 'jsonl'], { label: '{}', icon: FileJson, colors: gold });
add(['xml', 'svgx'], { icon: FileCode2, colors: powerpoint });
add(['yaml', 'yml', 'toml', 'ini', 'env', 'conf', 'config', 'properties'], { icon: Braces, colors: slate });
add(['sql', 'db', 'sqlite', 'sqlite3', 'prisma'], { icon: Database, colors: blue });
add(['sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'], { icon: Terminal, colors: slate });
add(['rb', 'erb'], { label: 'RB', icon: FileCode2, colors: red });
add(['go'], { label: 'GO', icon: FileCode2, colors: teal });
add(['rs'], { label: 'RS', icon: FileCode2, colors: powerpoint });
add(['swift'], { label: 'SW', icon: FileCode2, colors: powerpoint });
add(['java', 'kt', 'kts'], { icon: FileCode2, colors: red });
add(['c', 'h', 'cpp', 'hpp', 'cc', 'cs'], { icon: FileCode2, colors: purple });
add(['dart'], { label: 'D', icon: FileCode2, colors: blue });
add(['lock', 'gitignore', 'dockerfile', 'makefile'], { icon: Braces, colors: slate });

// Images, designs, media and archives.
add(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'heic', 'heif', 'bmp', 'tif', 'tiff', 'svg', 'ico'], { icon: FileImage, colors: blue });
add(['psd', 'ai', 'eps', 'indd', 'fig', 'sketch'], { icon: FileImage, colors: purple });
add(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz', 'dmg', 'iso'], { icon: FileArchive, colors: purple });
add(['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'], { icon: FileVideo, colors: purple });
add(['mp3', 'wav', 'flac', 'aac', 'ogg', 'aiff', 'm4a', 'mid', 'midi'], { icon: FileAudio, colors: teal });
add(['txt', 'log'], { icon: FileText, colors: neutral });

function fileExtension(name: string, extension?: string | null): string {
    const provided = extension?.trim().replace(/^\./, '').toLowerCase();
    if (provided) return provided;
    const basename = name.toLowerCase().split('/').pop() || '';
    if (['dockerfile', 'makefile', '.gitignore', '.env'].includes(basename)) {
        return basename.replace(/^\./, '');
    }
    return basename.includes('.') ? basename.split('.').pop() || '' : '';
}

/** One small, brand-colored file mark shared by project and task attachments. */
export function FileTypeIcon({ name, extension, size = 'normal', thumbnailUrl }: Props) {
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const ext = fileExtension(name, extension);
    const appearance = types[ext] || { icon: File, colors: neutral };
    const Icon = appearance.icon;
    const small = size !== 'normal';
    const inline = size === 'inline';
    const grid = size === 'grid';
    const isRaster = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext);
    const preview = isRaster && thumbnailUrl && failedUrl !== thumbnailUrl ? thumbnailUrl : null;

    if (preview) {
        return <span className={
            'block shrink-0 overflow-hidden bg-muted ' +
            (grid ? 'h-full w-full rounded-lg' : inline ? 'size-5 rounded' : small ? 'size-8 rounded-md' : 'size-10 rounded-lg')
        }>
            <img src={preview} alt="" draggable={false} loading="lazy" decoding="async"
                width={128} height={128} className="h-full w-full object-cover"
                onError={() => setFailedUrl(preview)} />
        </span>;
    }

    return <span
        title={ext ? ext.toUpperCase() + ' file' : 'File'}
        aria-hidden="true"
        className={'grid shrink-0 place-items-center font-bold tracking-tight ' +
            (grid ? 'size-10 rounded-lg' : inline ? 'size-5 rounded' : small ? 'size-8 rounded-md' : 'size-10 rounded-lg') +
            ' ' + appearance.colors}
    >
        {appearance.label
            ? <span className={inline ? 'text-[8px]' : appearance.label.length >= 4 ? 'text-[9px]' : appearance.label.length === 3 ? 'text-[10px]' : small ? 'text-[12px]' : 'text-sm'}>
                {appearance.label}
            </span>
            : <Icon className={inline ? 'size-3.5' : small ? 'size-4' : 'size-5'} strokeWidth={1.7} />}
    </span>;
}
