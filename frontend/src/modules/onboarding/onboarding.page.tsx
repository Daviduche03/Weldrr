import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, LoaderCircle, Puzzle, Sparkles, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/logo'
import { authApi } from '@/lib/api/auth'
import { workspaceApi } from '@/lib/api/workspace'
import { githubApi } from '@/lib/api/github'
import { ApiError } from '@/lib/http'
import { useWorkspace } from '@/modules/workspace/workspace-provider'
import { cn } from '@/lib/utils'

type Product = 'docs' | 'sdk' | 'both'

const steps = ['Identity', 'Workspace', 'Product', 'GitHub', 'Team'] as const

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

const productOptions: { value: Product; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'docs', label: 'Docs', desc: 'A hosted documentation site for your API.', icon: BookOpen },
  { value: 'sdk', label: 'SDKs', desc: 'Type-safe client libraries for your API.', icon: Puzzle },
  { value: 'both', label: 'Both', desc: 'Documentation and SDKs, generated together.', icon: Sparkles },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setWorkspace } = useWorkspace()

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd')

  const [stepName, setStepName] = useState('')
  const [accountType, setAccountType] = useState<'developer' | 'team'>('developer')
  const [company, setCompany] = useState('')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const [product, setProduct] = useState<Product>('both')

  const [inviteText, setInviteText] = useState('')

  const [githubConnected, setGithubConnected] = useState(false)
  const [githubLogin, setGithubLogin] = useState<string | undefined>()
  const [githubLoading, setGithubLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const emails = useMemo(() => parseEmails(inviteText), [inviteText])

  const loadGithub = async () => {
    setGithubLoading(true)
    try {
      const status = await githubApi.status()
      setGithubConnected(status.connected)
      setGithubLogin(status.login)
    } catch {
      setGithubConnected(false)
    } finally {
      setGithubLoading(false)
    }
  }

  useEffect(() => {
    if (searchParams.get('github') === 'connected') {
      void loadGithub()
    }
  }, [searchParams])

  const connectGithub = async () => {
    setError(null)
    try {
      const { url } = await githubApi.authUrl()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start GitHub connect')
    }
  }

  const canContinue = (() => {
    switch (step) {
      case 0:
        return stepName.trim().length > 0
      case 1:
        return name.trim().length > 0
      case 2:
        return product !== null
      case 3:
        return githubConnected
      case 4:
        return true
      default:
        return true
    }
  })()

  const goNext = () => {
    setDirection('fwd')
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setDirection('back')
    setStep((s) => Math.max(0, s - 1))
  }

  const submit = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await authApi.updateProfile({
        name: stepName.trim(),
        accountType,
        ...(company.trim() ? { company: company.trim() } : {}),
      })

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
      goNext()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong during onboarding')
    } finally {
      setBusy(false)
    }
  }

  const done = step >= steps.length

  const stepCls = cn(
    'wf-step',
    direction === 'fwd' ? 'wf-step--fwd' : 'wf-step--back',
  )

  const previewPrefill = product === 'sdk' || product === 'both' ? 'SDKs' : product === 'docs' ? 'Docs' : ''

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        {!done && (
          <div className="mb-8 flex items-center gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center text-brand">
              <LogoMark className="size-10" />
            </span>
            <div className="text-2xl">
              <div className="font-semibold tracking-tight">Welcome to Weldrr</div>
              <div className="mt-1 text-sm text-muted-foreground">Let’s set up your workspace.</div>
            </div>
          </div>
        )}

        {!done && (
          <div className="mb-8 flex items-center gap-2">
            {steps.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    i < step
                      ? 'bg-brand text-brand-foreground'
                      : i === step
                        ? 'border border-brand bg-brand-soft text-brand'
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
        )}

        {!done && (
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 0 && 'Tell us about you'}
            {step === 1 && 'Name your workspace'}
            {step === 2 && 'What are you building?'}
            {step === 3 && 'Connect GitHub'}
            {step === 4 && 'Invite your team'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {step === 0 && 'This helps us tailor the experience.'}
            {step === 1 && 'This is where your projects and docs live.'}
            {step === 2 && 'Pick what Weldrr should help you ship.'}
            {step === 3 && 'Build your SDKs and docs straight from your repos.'}
            {step === 4 && 'You can always add members later.'}
          </p>
        </div>
      )}

        <div className="space-y-6">
            {step === 0 && (
              <div className={cn('space-y-5', stepCls)}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">What should we call you?</label>
                  <Input
                    value={stepName}
                    onChange={(e) => setStepName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Account type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: 'developer', label: 'Developer', desc: 'Building on my own' },
                        { value: 'team', label: 'Team', desc: 'Building with a company' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAccountType(opt.value)}
                        className={cn(
                          'rounded-lg border px-4 py-3 text-left transition-colors',
                          accountType === opt.value
                            ? 'border-brand bg-brand-soft'
                            : 'border-border bg-background hover:bg-muted',
                        )}
                      >
                        <div className="text-base font-medium">{opt.label}</div>
                        <div className="mt-0.5 text-sm text-muted-foreground">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {accountType === 'team' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Company</label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className={cn('space-y-5', stepCls)}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Workspace name</label>
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
                    Used in URLs like weldrr.app/{slug || 'acme'}.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={cn('space-y-3', stepCls)}>
                {productOptions.map((opt) => {
                  const active = product === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setProduct(opt.value)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                        active
                          ? 'border-brand bg-brand-soft'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'shrink-0 transition-colors',
                          active ? 'text-brand' : 'text-muted-foreground',
                        )}
                      >
                        {<opt.icon className="size-6" />}
                      </span>
                      <span className="flex-1">
                        <span className="block text-base font-medium">{opt.label}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{opt.desc}</span>
                      </span>
                      <span
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-full border',
                          active ? 'border-brand bg-brand text-brand-foreground' : 'border-border',
                        )}
                      >
                        {active && (
                          <svg viewBox="0 0 16 16" fill="none" className="size-3" aria-hidden="true">
                            <path
                              d="M3.5 8.5l3 3 6-7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                  </svg>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 3 && (
              <div className={cn('space-y-3', stepCls)}>
                {!githubConnected ? (
                  <div className="rounded-xl border border-border bg-background p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Connect GitHub to generate docs and SDKs straight from your repositories.
                    </p>
                    <Button className="mt-4" onClick={connectGithub} disabled={githubLoading}>
                      {githubLoading && <LoaderCircle className="size-4 animate-spin" />}
                      Connect GitHub
                    </Button>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={goNext}
                        className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Skip for now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-background p-5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                        {(githubLogin ?? '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">@{githubLogin}</div>
                        <div className="text-xs text-muted-foreground">Connected</div>
                      </div>
                      <button
                        type="button"
                        onClick={connectGithub}
                        className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Switch account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
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
                      : 'You can skip this and invite members later.'}
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

            {done && (
              <div className={cn('py-4 text-center', stepCls)}>
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden="true">
                    <path
                      d="M5 13l4 4 10-11"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight">You’re all set</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Your workspace <span className="font-medium text-foreground">{name.trim()}</span> is ready for{' '}
                  {previewPrefill || 'docs & SDKs'}. Create your first project to start generating.
                </p>
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button size="lg" onClick={() => navigate('/projects/new')}>
                    Create your first project
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
                    Go to dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!done && (
            <div className="flex items-center justify-between border-t border-border pt-6">
              <Button variant="outline" onClick={goBack} disabled={step === 0 || busy}>
                Back
              </Button>
              <Button
                onClick={step === 4 ? submit : goNext}
                disabled={step === 4 ? busy : !canContinue || busy}
              >
                {busy && <LoaderCircle className="size-4 animate-spin" />}
                {step === 4 ? 'Finish' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
    </div>
  )
}