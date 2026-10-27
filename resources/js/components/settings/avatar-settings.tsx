import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Camera, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import type { User } from '@/types';

export function AvatarSettings({ user }: { user: User }) {
    const fileInput = useRef<HTMLInputElement>(null);
    const [selected, setSelected] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const pick = (file: File | undefined) => {
        setError('');
        setSaved(false);
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Use a JPEG, PNG or WebP image.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Maximum file size is 5 MB.');
            return;
        }
        setSelected(file);
        setPreview(URL.createObjectURL(file));
    };

    const clearSelection = () => {
        setSelected(null);
        setPreview(null);
        if (fileInput.current) fileInput.current.value = '';
    };

    const save = () => {
        if (!selected || processing) return;
        setProcessing(true);
        setError('');
        router.post('/settings/profile/avatar', { avatar: selected }, {
            forceFormData: true,
            preserveScroll: true,
            onError: (errors) => setError(errors.avatar || 'Unable to upload the photo.'),
            onSuccess: () => {
                clearSelection();
                setSaved(true);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const remove = () => {
        if (processing) return;
        setProcessing(true);
        setError('');
        router.delete('/settings/profile/avatar', {
            preserveScroll: true,
            onSuccess: () => {
                clearSelection();
                setSaved(true);
            },
            onError: (errors) => setError(errors.avatar || 'Unable to remove the photo.'),
            onFinish: () => setProcessing(false),
        });
    };

    return <section className="space-y-4" aria-label="Profile photo">
        <div>
            <h2 className="text-sm font-medium">Profile photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Square WebP 320 × 320 · JPEG, PNG or WebP · maximum 5 MB.</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
                <UserAvatar user={user} preview={preview} className="size-20" />
                <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-muted ring-2 ring-background">
                    <Camera className="size-3.5 text-muted-foreground" />
                </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <div className="flex flex-wrap gap-2">
                    <input
                        ref={fileInput}
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Select profile photo"
                        onChange={(event) => pick(event.currentTarget.files?.[0])}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={processing} onClick={() => fileInput.current?.click()}>
                        <Upload className="size-4" /> Choose photo
                    </Button>
                    {selected && <Button type="button" size="sm" disabled={processing} onClick={save}>
                        {processing ? 'Uploading…' : 'Save photo'}
                    </Button>}
                    {(user.avatar || selected) && <Button type="button" variant="ghost" size="sm" disabled={processing}
                        onClick={() => selected ? clearSelection() : remove()}>
                        <Trash2 className="size-4" /> {selected ? 'Cancel' : 'Remove'}
                    </Button>}
                </div>
                {selected && <span className="max-w-full truncate text-xs text-muted-foreground">{selected.name}</span>}
                {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
                {saved && <p className="text-xs text-green-600" role="status">Photo updated</p>}
            </div>
        </div>
    </section>;
}
