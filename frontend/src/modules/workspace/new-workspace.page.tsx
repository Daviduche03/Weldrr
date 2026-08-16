import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowPathIcon, BuildingOfficeIcon, UserPlusIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { workspaceApi } from '@/lib/api/workspace'
import { ApiError } from '@/lib/http'
import { useWorkspace } from '@/modules/workspace/workspace-provider'
import { cn } from '@/lib/utils'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

function parseEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
}

const steps = [
  { label: 'Details', icon: BuildingOfficeIcon },
  { label: 'Invite', icon: UserPlusIcon },
] as const

export function NewWorkspacePage() {
  const navigate = useNavigate()
  const { setWorkspace } = useWorkspace()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [inviteText, setInviteText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const emails = parseEmails(inviteText)

  const goNext = () => {
    setDirection('fwd')
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setDirection('back')
    setStep((s) => Math.max(0, s - 1))
  }

  const handleCreate = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    setError(null)
    try {
      const workspace = await workspaceApi.create({
        name: name.trim(),
        slug: slug.trim() || undefined,
      })
      setWorkspace(workspace)

      if (emails.length > 0) {
        await Promise.all(
          emails.map((email) =>
            workspaceApi.inviteMember(email, 'member').catch(() => undefined),
          ),
        )
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create workspace')
      setCreating(false)
    }
  }

  const stepCls = cn(
    'wf-step',
    direction === 'fwd' ? 'wf-step--fwd' : 'wf-step--back',
  )

  return (
    <div className="wf-enter mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-2">
        {steps.map(({ label, icon: StepIcon }, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
                i <= step ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <StepIcon className="size-4" />
            </span>
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              {label}
            </span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 0 ? 'Name your workspace' : 'Invite your team'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {step === 0
            ? 'This is where your projects and docs live.'
            : 'You can skip this and invite members later.'}
        </p>
      </div>

      {step === 0 && (
        <div className={cn('space-y-5', stepCls)}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Workspace name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value))
              }}
              placeholder="e.g. Acme Corp"
              autoFocus
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="acme"
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Used in URLs like weldrr.app/{slug || 'acme'}.
            </p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={cn('space-y-3', stepCls)}>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Teammate emails</label>
            <textarea
              value={inviteText}
              onChange={(e) => setInviteText(e.target.value)}
              placeholder="teammate@company.com, another@company.com"
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {emails.length > 0
                ? `${emails.length} valid invite${emails.length === 1 ? '' : 's'} ready.`
                : 'Comma or space separated.'}
            </p>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === 0 || creating}>
          Back
        </Button>
        {step < 1 ? (
          <Button onClick={goNext} disabled={!name.trim()}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={creating}>
            {creating && <ArrowPathIcon className="size-4 animate-spin" />}
            Create workspace
          </Button>
        )}
      </div>
    </div>
  )
}
