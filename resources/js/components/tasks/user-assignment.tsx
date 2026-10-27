import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserAssignmentProps {
  assignedUsers: User[];
  availableUsers: User[];
  onAssign: (userId: number) => void;
  onUnassign: (userId: number) => void;
  disabled?: boolean;
}

export function UserAssignment({
  assignedUsers,
  availableUsers,
  onAssign,
  onUnassign,
  disabled,
}: UserAssignmentProps) {
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const unassignedUsers = availableUsers.filter(
    (user) => !assignedUsers.find((assigned) => assigned.id === user.id)
  );

  const handleAssign = (userId: number) => {
    onAssign(userId);
    // Popup stays open for assigning multiple users
  };

  return (
    <div className="space-y-3">
      {/* Assigned users list */}
      <div className="flex flex-wrap gap-2">
        {assignedUsers.map((user) => (
          <div
            key={user.id}
            className="group flex items-center gap-2 rounded-full bg-accent pl-1 pr-3 py-1 transition-all duration-200 hover:bg-accent/80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-[11px] font-semibold text-white">
              {getInitials(user.name)}
            </div>
            <span className="text-sm font-medium">{user.name}</span>
            {!disabled && assignedUsers.length > 1 && (
                <button
                    onClick={() => onUnassign(user.id)}
                    className="ml-1 rounded-full p-0.5 hover:bg-background/80 transition-colors"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
          </div>
        ))}

        {/* Add user button */}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-3 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-sm">Assign User</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search users..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {unassignedUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.name}
                        onSelect={() => handleAssign(user.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-[11px] font-semibold text-white">
                            {getInitials(user.name)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Empty state */}
      {assignedUsers.length === 0 && (
        <p className="text-sm text-muted-foreground">No users assigned yet</p>
      )}
    </div>
  );
}