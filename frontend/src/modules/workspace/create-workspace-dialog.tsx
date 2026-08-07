import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/logo'
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

const steps = ['Details', 'Invite', 'Review'] as const

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { setWorkspace } = useWorkspace()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [inviteText, setInviteText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const emails = parseEmails(inviteText)

  const reset = () => {
    setStep(0)
    setDirection('fwd')
    setName('')
    setSlug('')
    setInviteText('')
    setError(null)
    setLoading(false)
  }

  const close = () => {
    reset()
    onOpenChange(false)
  }

  const goNext = () => {
    setDirection('fwd')
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setDirection('back')
    setStep((s) => Math.max(0, s - 1))
  }

  const submit = async () => {
    if (!name.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const workspace = await workspaceApi.create({
        name: name.trim(),
        slug: slug.trim() || undefined,
      })
      setWorkspace(workspace)
      close()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create workspace')
    } finally {
      setLoading(false)
    }
  }

  const canContinue = step === 0 ? name.trim().length > 0 : true

  const stepCls = cn(
    'wf-step',
    direction === 'fwd' ? 'wf-step--fwd' : 'wf-step--back',
  )

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
        else onOpenChange(true)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <div className="wf-enter">
            <div className="rounded-t-2xl border-b border-border bg-muted px-8 py-6">
              <div className="flex items-center gap-3.5">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-brand">
                  <LogoMark className="size-9" />
                </span>
                <div>
                  <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
                    New workspace
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-sm text-muted-foreground">
                    Create a workspace for your team.
                  </DialogPrimitive.Description>
                </div>
              </div>
            </div>

            <div className="px-8 pt-6">
              <div className="flex items-center gap-2">
                {steps.map((label, i) => (
                  <div key={label} className="flex flex-1 items-center gap-2">
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        i <= step
                          ? 'bg-brand text-brand-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                      {label}
                    </span>
                    {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 py-6">
              <div key={step} className={cn('space-y-4', stepCls)}>
                {step === 0 && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Name</label>
                      <Input
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value))
                        }}
                        placeholder="e.g. Acme Corp"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">Slug</label>
                      <Input
                        value={slug}
                        onChange={(e) =>
                          setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                        }
                        placeholder="acme"
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Used in URLs like weldrr.app/acme.
                      </p>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">
                        Invite your team
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        You can skip this and invite members later.
                      </p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Teammate emails
                      </label>
                      <textarea
                        value={inviteText}
                        onChange={(e) => setInviteText(e.target.value)}
                        placeholder="teammate@company.com, another@company.com"
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                      />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {emails.length > 0
                          ? `${emails.length} valid invite${emails.length === 1 ? '' : 's'} ready. Invites are sent after the workspace is created.`
                          : 'Comma or space separated. Invites are sent after the workspace is created.'}
                      </p>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight">
                        Ready to create
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Review your workspace details.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name.trim()}</span>
                        {slug && (
                          <span className="text-xs text-muted-foreground">
                            weldrr.app/{slug}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 border-t border-border pt-3">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Invites
                        </span>
                        {emails.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {emails.map((email) => (
                              <span
                                key={email}
                                className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                              >
                                <span className="truncate">{email}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            No teammates invited yet.
                          </p>
                        )}
                      </div>
                    </div>
                    {error && (
                      <p
                        role="alert"
                        className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                      >
                        {error}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between gap-2.5">
                <Button variant="outline" onClick={goBack} disabled={step === 0 || loading}>
                  Back
                </Button>
                {step < 2 ? (
                  <Button onClick={goNext} disabled={!canContinue}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={submit} disabled={!name.trim() || loading}>
                    {loading && <LoaderCircle className="size-4 animate-spin" />}
                    Create workspace
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}