import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { ApiKey, Member } from '@/lib/types'
import { cn } from '@/lib/utils'

const tabs = ['Members', 'API keys', 'Billing'] as const

export function SettingsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Members')
  const [members, setMembers] = useState<Member[]>([])
  const [keys, setKeys] = useState<ApiKey[]>([])

  useEffect(() => {
    let mounted = true
    Promise.all([api.listMembers(), api.listApiKeys()]).then(([m, k]) => {
      if (mounted) {
        setMembers(m)
        setKeys(k)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-brand text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 max-w-3xl">
        {tab === 'Members' && (
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            {members.map((member, i) => (
              <div
                key={member.id}
                className={cn(
                  'flex items-center justify-between gap-4 px-6 py-4',
                  i > 0 && 'border-t border-border',
                )}
              >
                <div>
                  <div className="text-sm font-medium">{member.email}</div>
                  <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {member.role}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            <div className="border-t border-border px-6 py-4">
              <Button size="sm" variant="outline">
                Invite member
              </Button>
            </div>
          </div>
        )}

        {tab === 'API keys' && (
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            {keys.map((key, i) => (
              <div
                key={key.id}
                className={cn(
                  'flex items-center justify-between gap-4 px-6 py-4',
                  i > 0 && 'border-t border-border',
                )}
              >
                <div>
                  <div className="text-sm font-medium">{key.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {key.prefix}•••••••••••••
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {key.lastUsedAt
                    ? `Used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                    : 'Never used'}
                </span>
              </div>
            ))}
            <div className="border-t border-border px-6 py-4">
              <Button size="sm" variant="outline">
                Create key
              </Button>
            </div>
          </div>
        )}

        {tab === 'Billing' && (
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold tracking-tight">Plan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You are currently on the Pro plan. View usage and manage your subscription.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg">Manage billing</Button>
              <Button size="lg" variant="outline">
                View invoices
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
