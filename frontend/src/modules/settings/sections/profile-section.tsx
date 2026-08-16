import { KeyIcon } from '@heroicons/react/24/solid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/modules/auth/auth-provider'
import type { User } from '@/lib/types'
import { Avatar, Field, SaveButton, Section } from '@/modules/settings/settings/ui'

export function ProfileSection({
  profile,
  name,
  setName,
  saved,
  onSave,
}: {
  profile: User | null
  name: string
  setName: (value: string) => void
  saved: boolean
  onSave: () => void
}) {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <Section
        title="Profile"
        description="Your personal information shown across Weldrr."
        footer={
          <SaveButton saved={saved} onClick={onSave}>
            Save changes
          </SaveButton>
        }
      >
        <div className="flex items-center gap-4">
          <Avatar name={profile?.name ?? ''} className="size-14 text-lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{profile?.name || '—'}</span>
              <Badge variant="secondary">{profile?.accountType ?? 'team'}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{profile?.email}</div>
            <div className="mt-0.5 text-xs text-muted-foreground/70">
              {profile?.isEmailVerified ? 'Email verified' : 'Email not verified'}
            </div>
          </div>
        </div>
        <div className="mt-6 grid max-w-2xl gap-6 sm:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" hint="Contact support to change your email.">
            <Input value={profile?.email ?? ''} disabled />
          </Field>
        </div>
      </Section>

      <Section title="Sign-in" description="Security options for your account.">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
              <KeyIcon className="size-4" />
            </span>
            <div>
              <div className="text-sm font-medium">Signed in as {user?.email}</div>
              <div className="text-xs text-muted-foreground">Password authentication</div>
            </div>
          </div>
          <Button size="sm" variant="outline">
            Manage
          </Button>
        </div>
      </Section>
    </div>
  )
}
