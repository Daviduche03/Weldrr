import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BoltIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CheckIcon,
  CircleStackIcon,
  CodeBracketIcon,
  CubeIcon,
  ServerStackIcon,
  ShareIcon,
  SparklesIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/solid'
import { LoaderCircle } from 'lucide-react'
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

const steps = [
  { label: 'Identity', icon: UserIcon },
  { label: 'Workspace', icon: BuildingOffice2Icon },
  { label: 'Product', icon: SparklesIcon },
  { label: 'Features', icon: BoltIcon },
  { label: 'GitHub', icon: CodeBracketIcon },
  { label: 'Team', icon: UserGroupIcon },
] as const

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

const accountOptions: { value: 'developer' | 'team'; label: string; desc: string | null; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'developer', label: 'Developer', desc: null, icon: UserIcon },
  { value: 'team', label: 'Team', desc: 'Building with a company', icon: UserGroupIcon },
]

const productOptions: { value: Product; label: string; desc: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'docs', label: 'Docs', desc: 'A hosted documentation site for your API.', icon: BookOpenIcon },
  { value: 'sdk', label: 'SDKs', desc: 'Type-safe client libraries for your API.', icon: CubeIcon },
  { value: 'both', label: 'Both', desc: 'Documentation and SDKs, generated together.', icon: SparklesIcon },
]

const apiTypeOptions: { value: 'openapi' | 'graphql' | 'grpc' | 'asyncapi'; label: string; desc: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'openapi', label: 'REST API', desc: 'OpenAPI spec', icon: ServerStackIcon },
  { value: 'graphql', label: 'GraphQL', desc: 'Schema-based', icon: ShareIcon },
  { value: 'grpc', label: 'gRPC', desc: 'Protobuf services', icon: CircleStackIcon },
  { value: 'asyncapi', label: 'Events', desc: 'Async / streaming', icon: BoltIcon },
]

const featureOptions: { id: string; label: string; tier: 'Pro' | 'Enterprise'; desc: string }[] = [
  { id: 'domain', label: 'Custom docs domain', tier: 'Pro', desc: 'docs.yourcompany.com' },
  { id: 'branding', label: 'Branding & logo', tier: 'Pro', desc: 'Your colors and logo on the docs site' },
  { id: 'languages', label: 'More SDK languages', tier: 'Pro', desc: 'Go, Java, Ruby, and more' },
  { id: 'cli', label: 'CLI & CI workflows', tier: 'Pro', desc: 'Generate and publish from your pipeline' },
  { id: 'versioning', label: 'API versioning', tier: 'Enterprise', desc: 'Docs pinned per API version' },
  { id: 'private', label: 'Private docs', tier: 'Enterprise', desc: 'Auth-gated documentation for your team' },
]

function DocsPreview({ domain }: { domain: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background text-left shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate rounded-md bg-background px-3 py-1 font-mono text-[11px] text-muted-foreground">
          {domain}
        </span>
      </div>
      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-border p-3 sm:block">
          <div className="space-y-1.5">
            <div className="rounded bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Getting started
            </div>
            <div className="rounded bg-accent px-2 py-1 text-[11px] font-medium text-foreground">
              Quickstart
            </div>
            <div className="px-2 py-1 text-[11px] text-muted-foreground">Authentication</div>
            <div className="mt-2 rounded bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Reference
            </div>
            <div className="px-2 py-1 text-[11px] text-muted-foreground">Health</div>
            <div className="px-2 py-1 text-[11px] text-muted-foreground">Agents</div>
            <div className="px-2 py-1 text-[11px] text-muted-foreground">Chat</div>
          </div>
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="rounded-md bg-muted px-3 py-2 text-[11px] font-medium">
            POST /v1/chat/completions
          </div>
          <div className="mt-3 h-2 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-2 w-1/2 rounded bg-muted" />
          <div className="mt-4 space-y-1.5">
            <div className="rounded-lg border border-border p-2.5">
              <div className="h-2 w-16 rounded bg-brand/60" />
              <div className="mt-2 h-2 w-full rounded bg-muted" />
              <div className="mt-1.5 h-2 w-2/3 rounded bg-muted" />
            </div>
            <div className="rounded-lg border border-border p-2.5">
              <div className="h-2 w-16 rounded bg-brand/60" />
              <div className="mt-2 h-2 w-full rounded bg-muted" />
              <div className="mt-1.5 h-2 w-3/4 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [apiType, setApiType] = useState<'openapi' | 'graphql' | 'grpc' | 'asyncapi'>('openapi')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

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
        return true
      case 3:
        return selectedFeatures.length > 0
      case 4:
        return githubConnected
      case 5:
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

  const previewPrefill = product === 'both' ? 'docs & SDKs' : product === 'docs' ? 'Docs' : 'SDKs'

  const previewDomain = `${slug.trim() || name.trim() || 'your-api'}.weldrr.app`

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-6 sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        <div
          className="relative hidden flex-col justify-between overflow-hidden rounded-2xl border border-border bg-muted p-8 lg:flex sm:p-10"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          <div className="flex items-center gap-2 text-brand">
            <LogoMark className="size-8" />
            <span className="text-lg font-semibold tracking-tight text-foreground">Weldrr</span>
          </div>
          <div className="my-10">
            <DocsPreview domain={previewDomain} />
          </div>
          <div>
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Your docs and SDKs, generated from one source of truth
            </h2>
            <p className="mt-3 text-pretty text-sm text-muted-foreground">
              Hosted docs, type-safe SDKs, and a CLI for your API — up in minutes, not weeks.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto flex h-[38rem] w-full max-w-xl flex-col">
            {!done && (
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
        )}

        {!done && (
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 0 && 'Tell us about you'}
            {step === 1 && 'Name your workspace'}
            {step === 2 && 'What are you building?'}
            {step === 3 && 'Which features matter to you?'}
            {step === 4 && 'Connect GitHub'}
            {step === 5 && 'Invite your team'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {step === 0 && 'This helps us tailor the experience.'}
            {step === 1 && 'This is where your projects and docs live.'}
            {step === 2 && 'Pick what Weldrr should help you ship.'}
            {step === 3 && 'These are included in Pro and Enterprise. Pick what you’d actually use.'}
            {step === 4 && 'Build your SDKs and docs straight from your repos.'}
            {step === 5 && 'You can always add members later.'}
          </p>
        </div>
      )}

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto">
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
                    {accountOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAccountType(opt.value)}
                          className={cn(
                            'rounded-lg border px-4 py-3 text-left transition-colors',
                            accountType === opt.value
                              ? 'bg-muted text-foreground'
                              : 'border-border bg-background hover:bg-muted',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 shrink-0 text-brand" />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                          {opt.desc && (
                            <div className="mt-1 text-xs text-muted-foreground">{opt.desc}</div>
                          )}
                        </button>
                      )
                    })}
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium">What will you build?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {apiTypeOptions.map((opt) => {
                      const Icon = opt.icon
                      const active = apiType === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setApiType(opt.value)}
                          className={cn(
                            'rounded-lg border px-4 py-3 text-left transition-colors',
                            active
                              ? 'bg-muted text-foreground'
                              : 'border-border bg-background hover:bg-muted',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 shrink-0 text-brand" />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{opt.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    We’ll tailor the generated docs and SDKs to this type.
                  </p>
                </div>
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
                          ? 'bg-muted text-foreground'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <opt.icon className="size-5 shrink-0 text-brand" />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{opt.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{opt.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 3 && (
              <div className={cn('space-y-3', stepCls)}>
                {featureOptions.map((f) => {
                  const active = selectedFeatures.includes(f.id)
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setSelectedFeatures((prev) =>
                          active ? prev.filter((id) => id !== f.id) : [...prev, f.id],
                        )
                      }
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                        active
                          ? 'bg-muted text-foreground'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <span className="flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium">{f.label}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              f.tier === 'Pro'
                                ? 'bg-brand-soft text-brand'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {f.tier}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{f.desc}</span>
                      </span>
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                          active ? 'border-brand bg-brand text-brand-foreground' : 'border-border',
                        )}
                      >
                        {active && <CheckIcon className="size-3.5" />}
                      </span>
                    </button>
                  )
                })}
                <p className="text-xs text-muted-foreground">
                  {selectedFeatures.length > 0
                    ? `Picked ${selectedFeatures.length}. These ship with ${
                        selectedFeatures.some((id) => featureOptions.find((f) => f.id === id)?.tier === 'Enterprise')
                          ? 'Enterprise'
                          : 'Pro'
                      } — you’ll get them when you upgrade.`
                    : 'Pick at least one — these are the upgrades that ship with paid plans.'}
                </p>
              </div>
            )}

            {step === 4 && (
              <div className={cn('space-y-3', stepCls)}>
                {!githubConnected ? (
                  <div className="rounded-xl border border-border bg-muted p-5 text-center">
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
                  <div className="rounded-xl border border-border bg-muted p-5">
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

            {step === 5 && (
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
              <div className={cn('flex h-full flex-col items-center justify-center', stepCls)}>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold tracking-tight">You’re all set</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Your workspace{' '}
                    <span className="font-medium text-foreground">{name.trim()}</span> is ready for{' '}
                    {previewPrefill || 'docs & SDKs'} — generated for a{' '}
                    {apiTypeOptions.find((o) => o.value === apiType)?.label} like this.
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
              </div>
            )}
          </div>

          {!done && (
            <div className="flex items-center justify-between border-t border-border pt-6">
              <Button variant="outline" onClick={goBack} disabled={step === 0 || busy}>
                Back
              </Button>
              <Button
                onClick={step === 5 ? submit : goNext}
                disabled={step === 5 ? busy : !canContinue || busy}
              >
                {busy && <LoaderCircle className="size-4 animate-spin" />}
                {step === 5 ? 'Finish' : 'Continue'}
              </Button>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
  )
}