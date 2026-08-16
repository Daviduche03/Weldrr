import {
  CheckIcon,
  ChevronUpDownIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/solid'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import type { Member } from '@/lib/types'
import { roleMeta } from '@/modules/settings/settings.data'
import { Avatar } from '@/modules/settings/settings/ui'

export function MembersSection({
  members,
  inviteEmail,
  setInviteEmail,
  onInvite,
  onChangeRole,
  onRemove,
}: {
  members: Member[]
  inviteEmail: string
  setInviteEmail: (value: string) => void
  onInvite: () => void
  onChangeRole: (id: string, role: Member['role']) => void
  onRemove: (id: string) => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      <div
        className="border-b border-border bg-muted px-6 py-3"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        <h2 className="text-sm font-medium text-muted-foreground">Members</h2>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          Manage who has access to this workspace.
        </p>
      </div>
      {members.length === 0 ? (
        <EmptyState
          icon={<UserGroupIcon className="size-6" />}title="No members yet"
          description="Invite your team to collaborate on this workspace."
          className="py-12"
        />
      ) : (
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={member.email} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{member.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {member.role === 'owner' ? (
                <Badge variant={roleMeta.owner.badge}>{roleMeta.owner.label}</Badge>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      {roleMeta[member.role].label}
                      <ChevronUpDownIcon className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(['admin', 'member'] as const).map((role) => (
                      <DropdownMenuItem key={role} onClick={() => onChangeRole(member.id, role)}>
                        {roleMeta[role].label}
                        {member.role === role && <CheckIcon className="ml-auto size-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {member.role !== 'owner' && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${member.email}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(member.id)}
                >
                  <TrashIcon className="size-4" />
                </Button>
              )}
            </div>
          </li>
        ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-4">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <UserPlusIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onInvite()}
            placeholder="teammate@company.com"
            className="pl-9"
          />
        </div>
        <Button size="sm" onClick={onInvite}>
          <PlusIcon className="size-4" />
          Invite member
        </Button>
      </div>
    </section>
  )
}
