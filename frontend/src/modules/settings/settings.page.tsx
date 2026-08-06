import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Check,
  ChevronsUpDown,
  Copy,
  CreditCard,
  Download,
  KeyRound,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import type { ApiKey, Member, Plan } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/auth/auth-provider'

const tabs = ['Profile', 'Workspace', 'Members', 'API keys', 'Billing', 'Notifications'] as const

const roleMeta: Record<Member['role'], { label: string; badge: 'default' | 'secondary' | 'outline' }> = {
  owner: { label: 'Owner', badge: 'default' },
  admin: { label: 'Admin', badge: 'secondary' },
  member: { label: 'Member', badge: 'outline' },
}

const plans: { id: Plan; name: string; price: string; desc: string }[] = [
  { id: 'free', name: 'Free', price: '$0', desc: 'Up to 2 projects, community support' },
  { id: 'pro', name: 'Pro', price: '$49', desc: 'Unlimited projects, priority support' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'SSO, self-hosting, SLA' },
]

const planLimits: Record<Plan, number | null> = { free: 2, pro: 50, enterprise: null }

const usageRows = [
  { label: 'Projects', used: 3 },
  { label: 'SDK downloads', used: 128 },
  { label: 'Docs served (30d)', used: 1_200_000 },
]

const invoices = [
  { id: 'inv_1', period: 'July 2026', date: 'Jul 1, 2026', amount: '$49.00', status: 'Paid' },
  { id: 'inv_2', period: 'June 2026', date: 'Jun 1, 2026', amount: '$49.00', status: 'Paid' },
  { id: 'inv_3', period: 'May 2026', date: 'May 1, 2026', amount: '$49.00', status: 'Paid' },
]

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

function useFlash(duration = 1600): [boolean, () => void] {
  const [active, setActive] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const fire = () => {
    setActive(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setActive(false), duration)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return [active, fire]
}

function Section({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="border-b border-border px-6 py-5">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          {footer}
        </div>
      )}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground',
        className,
      )}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  )
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        checked ? 'bg-brand' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

function SaveButton({
  saved,
  onClick,
  children,
}: {
  saved: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button size="sm" onClick={onClick}>
      {saved ? <Check /> : null}
      {saved ? 'Saved' : children}
    </Button>
  )
}

export function SettingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Profile')

  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [keys, setKeys] = useState<ApiKey[]>([])

  const [name, setName] = useState('')
  const [wsName, setWsName] = useState('')
  const [wsSlug, setWsSlug] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<(ApiKey & { secret: string }) | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro')
  const [notifications, setNotifications] = useState({
    generation: true,
    failures: true,
    releases: false,
    digest: false,
  })

  const [profileSaved, saveProfileFlash] = useFlash()
  const [workspaceSaved, saveWorkspaceFlash] = useFlash()
  const [planSaved, savePlanFlash] = useFlash()

  useEffect(() => {
    let mounted = true
    Promise.all([api.getWorkspace(), api.getProfile(), api.listMembers(), api.listApiKeys()]).then(
      ([w, p, m, k]) => {
        if (!mounted) return
        setProfile(p)
        setMembers(m)
        setKeys(k)
        setName(p.name)
        setWsName(w.name)
        setWsSlug(w.slug)
        setSelectedPlan(w.plan)
      },
    )
    return () => {
      mounted = false
    }
  }, [])

  const saveProfile = () => {
    api.updateProfile({ name }).then((p) => {
      setProfile(p)
      saveProfileFlash()
    })
  }

  const saveWorkspace = () => {
    api.updateWorkspace({ name: wsName, slug: wsSlug }).then(() => {
      saveWorkspaceFlash()
    })
  }

  const invite = () => {
    const email = inviteEmail.trim()
    if (!email || !email.includes('@')) return
    api.inviteMember(email).then((member) => {
      setMembers((prev) => [member, ...prev])
      setInviteEmail('')
    })
  }

  const changeRole = (id: string, role: Member['role']) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
    api.updateMemberRole(id, role)
  }

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
    api.removeMember(id)
  }

  const createKey = () => {
    const label = keyName.trim() || 'New key'
    api.createApiKey(label).then((key) => {
      setKeys((prev) => [key, ...prev])
      setNewKey(key)
      setKeyName('')
    })
  }

  const revokeKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id))
    if (newKey?.id === id) setNewKey(null)
    api.revokeApiKey(id)
  }

  const selectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    api.updatePlan(plan).then(() => savePlanFlash())
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
  }

  return (
    <div>
      <div className="px-6 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, workspace, and billing.
        </p>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border px-6 sm:px-8">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-brand text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 px-6 sm:px-8">
        {tab === 'Profile' && (
          <div className="mx-auto max-w-3xl space-y-6">
            <Section
              title="Profile"
              description="Your personal information shown across Weldrr."
              footer={
                <SaveButton saved={profileSaved} onClick={saveProfile}>
                  Save changes
                </SaveButton>
              }
            >
              <div className="flex items-center gap-4">
                <Avatar name={profile?.name ?? ''} className="size-14 text-lg" />
                <div>
                  <div className="font-medium">{profile?.name || '—'}</div>
                  <div className="text-sm text-muted-foreground">{profile?.email}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground/70">
                    Signed in with {user?.provider}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Email" hint="Contact support to change your email.">
                  <Input value={profile?.email ?? ''} disabled />
                </Field>
              </div>
            </Section>

            <Section
              title="Sign-in"
              description="Security options for your account."
            >
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <KeyRound className="size-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium">Connected with {user?.provider}</div>
                    <div className="text-xs text-muted-foreground">Two-factor auth is off</div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </div>
            </Section>
          </div>
        )}

        {tab === 'Workspace' && (
          <div className="mx-auto max-w-3xl space-y-6">
            <Section
              title="Workspace"
              description="This name and slug identify your workspace."
              footer={
                <SaveButton saved={workspaceSaved} onClick={saveWorkspace}>
                  Save changes
                </SaveButton>
              }
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Name">
                  <Input value={wsName} onChange={(e) => setWsName(e.target.value)} />
                </Field>
                <Field
                  label="Slug"
                  hint="Used in URLs like weldrr.app/acme."
                >
                  <Input
                    value={wsSlug}
                    onChange={(e) => setWsSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Danger zone"
              description="Permanently delete this workspace and all of its projects, SDKs, and docs."
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  There&apos;s no going back. This cannot be undone.
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 />
                  Delete workspace
                </Button>
              </div>
            </Section>
          </div>
        )}

        {tab === 'Members' && (
          <div className="mx-auto max-w-3xl">
            <section className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="border-b border-border px-6 py-5">
                <h2 className="font-semibold tracking-tight">Members</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage who has access to this workspace.
                </p>
              </div>
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
                              <ChevronsUpDown className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(['admin', 'member'] as const).map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => changeRole(member.id, role)}
                              >
                                {roleMeta[role].label}
                                {member.role === role && <Check className="ml-auto" />}
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
                          onClick={() => removeMember(member.id)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-4">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                  <UserPlus className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && invite()}
                    placeholder="teammate@company.com"
                    className="pl-9"
                  />
                </div>
                <Button size="sm" onClick={invite}>
                  <Plus />
                  Invite member
                </Button>
              </div>
            </section>
          </div>
        )}

        {tab === 'API keys' && (
          <div className="mx-auto max-w-3xl">
            <section className="overflow-hidden rounded-2xl border border-border bg-background">
              <div className="border-b border-border px-6 py-5">
                <h2 className="font-semibold tracking-tight">API keys</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keys for authenticating with the Weldrr API and CI.
                </p>
              </div>

              {newKey && (
                <div className="mx-6 mt-5 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Key created — copy it now</div>
                      <div className="mt-1 break-all font-mono text-sm">{newKey.secret}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(newKey.secret)}
                      aria-label="Copy key"
                    >
                      <Copy />
                      Copy
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    For security, you won&apos;t be able to see this key again.
                  </p>
                </div>
              )}

              <ul className="divide-y divide-border">
                {keys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                          <KeyRound className="size-3.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{key.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {key.prefix}•••••••••••
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <div>{key.lastUsedAt ? `Used ${new Date(key.lastUsedAt).toLocaleDateString()}` : 'Never used'}</div>
                      <div className="mt-0.5">Created {new Date(key.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Revoke ${key.name}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => revokeKey(key.id)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-4">
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createKey()}
                  placeholder="Name this key, e.g. CI pipeline"
                  className="max-w-xs"
                />
                <Button size="sm" onClick={createKey}>
                  <Plus />
                  Create key
                </Button>
              </div>
            </section>
          </div>
        )}

        {tab === 'Billing' && (
          <div className="mx-auto max-w-4xl space-y-6">
            <Section
              title="Plan"
              description={`You are currently on the ${selectedPlan} plan.`}
              footer={
                <SaveButton saved={planSaved} onClick={() => selectPlan(selectedPlan)}>
                  Save plan
                </SaveButton>
              }
            >
              <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
                {plans.map((plan) => {
                  const active = selectedPlan === plan.id
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={cn(
                        'relative bg-background p-6 text-left transition-colors hover:bg-muted',
                        active && 'bg-muted ring-1 ring-brand/60 ring-inset',
                      )}
                    >
                      {active && (
                        <Badge className="absolute right-4 top-4">Current</Badge>
                      )}
                      <div className="font-semibold tracking-tight">{plan.name}</div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
                        {plan.id !== 'enterprise' && (
                          <span className="text-sm text-muted-foreground">/mo</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">{plan.desc}</p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium">Usage</h3>
                <div className="mt-4 space-y-4">
                  {usageRows.map((row) => {
                    const limit = planLimits[selectedPlan]
                    const pct = limit ? Math.min(100, (row.used / limit) * 100) : 100
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="tabular-nums">
                            <span className="font-medium">{fmt(row.used)}</span>
                            <span className="text-muted-foreground">
                              {limit ? ` of ${fmt(limit)}` : ' — unlimited'}
                            </span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-[width] duration-500',
                              pct >= 100 ? 'bg-destructive' : 'bg-brand',
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Section>

            <Section
              title="Payment method"
              description="The card used to pay for your subscription."
              footer={
                <Button size="sm" variant="outline">
                  Update card
                </Button>
              }
            >
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <CreditCard className="size-4" />
                  </span>
                  <div>
                    <div className="font-mono text-sm">•••• •••• •••• 4242</div>
                    <div className="text-xs text-muted-foreground">Expires 12/2028</div>
                  </div>
                </div>
                <Badge variant="secondary">Visa</Badge>
              </div>
            </Section>

            <Section title="Invoices" description="Download receipts for past billing periods.">
              <ul className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between gap-4 py-3.5"
                  >
                    <div>
                      <div className="text-sm font-medium">{invoice.period}</div>
                      <div className="text-xs text-muted-foreground">{invoice.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{invoice.status}</Badge>
                      <span className="text-sm font-medium tabular-nums">{invoice.amount}</span>
                      <Button size="icon-sm" variant="ghost" aria-label={`Download ${invoice.period} invoice`}>
                        <Download />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}

        {tab === 'Notifications' && (
          <div className="mx-auto max-w-3xl space-y-6">
            <Section
              title="Email notifications"
              description="Choose which updates you receive by email."
            >
              <ul className="divide-y divide-border">
                {[
                  {
                    key: 'generation' as const,
                    label: 'Generation complete',
                    desc: 'When SDKs, docs, or a CLI finish generating.',
                  },
                  {
                    key: 'failures' as const,
                    label: 'Spec validation failed',
                    desc: 'When a spec fails to validate or generate.',
                  },
                  {
                    key: 'releases' as const,
                    label: 'New releases',
                    desc: 'When a new SDK version is published.',
                  },
                  {
                    key: 'digest' as const,
                    label: 'Weekly digest',
                    desc: 'A summary of usage and activity each Monday.',
                  },
                ].map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onChange={(value) =>
                        setNotifications((prev) => ({ ...prev, [item.key]: value }))
                      }
                    />
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
