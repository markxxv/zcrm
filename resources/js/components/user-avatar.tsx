import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type AvatarUser = { name: string; avatar?: string | null };

export function UserAvatar({
    user,
    className,
    preview,
}: {
    user: AvatarUser;
    className?: string;
    preview?: string | null;
}) {
    const initials = user.name.trim().split(/\s+/).slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase()).join('') || '?';

    return <Avatar className={cn('size-8 rounded-full', className)} title={user.name}>
        <AvatarImage
            src={preview ?? user.avatar ?? undefined}
            alt={user.name}
            className="size-full object-cover"
            draggable={false}
        />
        <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
            {initials}
        </AvatarFallback>
    </Avatar>;
}
