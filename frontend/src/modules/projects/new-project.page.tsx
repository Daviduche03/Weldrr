import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { projectApi } from '@/lib/api/projects'
import { githubApi } from '@/lib/api/github'
import type { GitRepo, GitHubRepo, SpecType } from '@/lib/types'
import { cn } from '@/lib/utils'

const specTypes: { value: SpecType; label: string; hint: string }[] = [
  { value: 'openapi', label: 'OpenAPI', hint: 'REST APIs' },
  { value: 'graphql', label: 'GraphQL', hint: 'Schemas' },
  { value: 'grpc', label: 'gRPC', hint: 'Protobuf' },
  { value: 'asyncapi', label: 'AsyncAPI', hint: 'Events' },
]

const languages: { id: string; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'php', label: 'PHP' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'swift', label: 'Swift' },
  { id: 'rust', label: 'Rust' },
  { id: 'csharp', label: 'C#' },
]

const sources = [
  { value: 'paste', label: 'Paste a spec', hint: 'Copy your spec in' },
  { value: 'url', label: 'From a URL', hint: 'Fetch remotely' },
  { value: 'upload', label: 'Upload a file', hint: 'JSON or YAML' },
  { value: 'github', label: 'Connect a GitHub repo', hint: 'Build from your codebase' },
] as const

const steps = ['Project', 'Spec', 'Generate'] as const


export function NewProjectPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd')
  const [name, setName] = useState('')
  const [specType, setSpecType] = useState<SpecType>('openapi')
  const [source, setSource] = useState<'paste' | 'url' | 'upload' | 'github'>('paste')
  const [specText, setSpecText] = useState('')
  const [gitRepo, setGitRepo] = useState<GitRepo | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['typescript'])
  const [generateDocs, setGenerateDocs] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [githubConnected, setGithubConnected] = useState(false)
  const [githubLogin, setGithubLogin] = useState<string | undefined>()
  const [githubLoading, setGithubLoading] = useState(false)
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [repoSearch, setRepoSearch] = useState('')

  const loadGithub = async () => {
    setGithubLoading(true)
    try {
      const status = await githubApi.status()
      setGithubConnected(status.connected)
      setGithubLogin(status.login)
      if (status.connected) {
        setGithubRepos(await githubApi.listRepos())
      }
    } catch {
      setGithubConnected(false)
    } finally {
      setGithubLoading(false)
    }
  }

  useEffect(() => {
    void loadGithub()
  }, [])

  useEffect(() => {
    if (searchParams.get('github') === 'connected') {
      setSearchParams({}, { replace: true })
      void loadGithub()
    }
  }, [searchParams, setSearchParams])

  const filteredRepos = useMemo(() => {
    const q = repoSearch.trim().toLowerCase()
    if (!q) return githubRepos
    return githubRepos.filter((r) => r.fullName.toLowerCase().includes(q))
  }, [githubRepos, repoSearch])

  const connectGithub = async () => {
    setError(null)
    try {
      const { url } = await githubApi.authUrl()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start GitHub connect')
    }
  }

  const canContinue =
    step === 0
      ? name.trim().length > 0
      : step === 1
        ? source === 'github'
          ? gitRepo !== null
          : specText.trim().length > 0
        : true

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      await projectApi.create({
        name,
        specType,
        specSource: source,
        sdkLanguages: selectedLanguages,
        cliEnabled: true,
        generateDocs,
        ...(source === 'url' ? { specUrl: specText.trim() } : {}),
        ...(source === 'paste' || source === 'upload'
          ? { specRaw: specText }
          : {}),
        ...(source === 'github' && gitRepo ? { gitRepo } : {}),
      })
      setDirection('fwd')
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setGenerating(false)
    }
  }

  const goNext = () => {
    setDirection('fwd')
    setStep((s) => s + 1)
  }

  const goBack = () => {
    setDirection('back')
    setStep((s) => Math.max(0, s - 1))
  }

  const stepCls = cn(
    'wf-step',
    direction === 'fwd' ? 'wf-step--fwd' : 'wf-step--back',
  )

  return (
    <div className="wf-enter mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                i <= step ? 'bg-brand text-brand-foreground' : 'bg-muted text-muted-foreground',
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

          {step === 0 && (
            <div className={cn('space-y-6', stepCls)}>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Name your project</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give your API a name. You can change it later.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Project name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Voice Agents API"
                  autoFocus
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Spec type</label>
                <div className="grid grid-cols-2 gap-2">
                  {specTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSpecType(t.value)}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-left transition-colors',
                        specType === t.value
                          ? 'border-brand bg-brand-soft'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={cn('space-y-6', stepCls)}>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Add your spec</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {source === 'github'
                    ? 'Connect a GitHub repo and we’ll build from your codebase.'
                    : `How do you want to provide your ${specTypes.find((s) => s.value === specType)?.label} spec?`}
                </p>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {sources.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSource(s.value)}
                      className={cn(
                        'rounded-lg border px-3 py-3 text-left transition-colors',
                        source === s.value
                          ? 'border-brand bg-brand-soft'
                          : 'border-border bg-background hover:bg-muted',
                      )}
                    >
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{s.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {source === 'github' ? (
                <div className="space-y-3">
                  {!githubConnected ? (
                    <div className="rounded-xl border border-border bg-background p-5">
                      <p className="text-sm text-muted-foreground">
                        No GitHub account connected yet. Connect to pick a repository to build from.
                      </p>
                      <Button className="mt-3" onClick={connectGithub} disabled={githubLoading}>
                        Connect GitHub
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                            {(githubLogin ?? '?').charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">@{githubLogin}</div>
                            <button
                              type="button"
                              onClick={connectGithub}
                              className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                              Switch account
                            </button>
                          </div>
                        </div>
                        {gitRepo && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                            {gitRepo.fullName}
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium">
                          Pick a repository
                        </label>
                        <input
                          value={repoSearch}
                          onChange={(e) => setRepoSearch(e.target.value)}
                          placeholder="Search your repositories…"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                        />
                      </div>

                      {githubLoading ? (
                        <p className="mt-3 text-sm text-muted-foreground">Loading repositories…</p>
                      ) : (
                        <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                          {filteredRepos.length === 0 && (
                            <p className="py-2 text-sm text-muted-foreground">
                              {repoSearch.trim()
                                ? 'No repositories match your search.'
                                : 'No repositories found.'}
                            </p>
                          )}
                          {filteredRepos.map((repo) => (
                            <button
                              key={repo.id}
                              type="button"
                              onClick={() =>
                                setGitRepo({
                                  provider: 'github',
                                  fullName: repo.fullName,
                                  cloneUrl: repo.cloneUrl,
                                  defaultBranch: repo.defaultBranch,
                                  private: repo.private,
                                })
                              }
                              className={cn(
                                'flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                                gitRepo?.fullName === repo.fullName
                                  ? 'border-brand bg-brand-soft'
                                  : 'border-border bg-background hover:bg-muted',
                              )}
                            >
                              <span className="relative shrink-0">
                                {repo.ownerAvatarUrl ? (
                                  <img
                                    src={repo.ownerAvatarUrl}
                                    alt=""
                                    className="size-9 rounded-full border border-border object-cover"
                                  />
                                ) : (
                                  <span className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground">
                                    {repo.fullName.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="truncate text-sm font-medium">
                                    {repo.fullName}
                                  </span>
                                  {repo.private && (
                                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                      Private
                                    </span>
                                  )}
                                </span>
                                {repo.description && (
                                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                    {repo.description}
                                  </span>
                                )}
                              </span>
                              {repo.language && (
                                <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                                  {repo.language}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {source === 'paste'
                      ? 'Paste your spec'
                      : source === 'url'
                        ? 'Spec URL'
                        : 'File contents'}
                  </label>
                  {source === 'paste' ? (
                    <textarea
                      value={specText}
                      onChange={(e) => setSpecText(e.target.value)}
                      placeholder={'openapi: 3.1.0\ninfo:\n  title: My API\n  version: 1.0.0\npaths: {}'}
                      rows={10}
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                    />
                  ) : (
                    <input
                      value={specText}
                      onChange={(e) => setSpecText(e.target.value)}
                      placeholder={
                        source === 'url'
                          ? 'https://api.example.com/openapi.json'
                          : 'Paste or drag a file…'
                      }
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className={cn('space-y-6', stepCls)}>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Ready to generate</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the SDK languages you want to support, then we&apos;ll generate everything.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-6">
                <div className="text-sm font-semibold tracking-tight">{name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {specType.toUpperCase()} ·{' '}
                  {source === 'paste'
                    ? 'Pasted spec'
                    : source === 'url'
                      ? 'Spec URL'
                      : source === 'github'
                        ? `GitHub repo${gitRepo ? ` · ${gitRepo.fullName}` : ''}`
                        : 'Uploaded file'}
                </div>
                {gitRepo && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{gitRepo.fullName}</span>
                    <span>·</span>
                    <span>{gitRepo.defaultBranch}</span>
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">SDK languages</label>
                    <span className="text-xs text-muted-foreground">
                      {selectedLanguages.length} selected
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {languages.map((lang) => {
                      const active = selectedLanguages.includes(lang.id)
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() =>
                            setSelectedLanguages((prev) =>
                              active
                                ? prev.filter((l) => l !== lang.id)
                                : [...prev, lang.id],
                            )
                          }
                          className={cn(
                            'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                            active
                              ? 'border-brand bg-brand text-brand-foreground'
                              : 'border-border bg-background text-muted-foreground hover:border-ring hover:text-foreground',
                          )}
                        >
                          {lang.label}
                        </button>
                      )
                    })}
</div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
                <div>
                  <label className="text-sm font-medium">Generate documentation</label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Host a documentation site for this API. Turn off for SDKs only.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={generateDocs}
                  onClick={() => setGenerateDocs((v) => !v)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                    generateDocs ? 'bg-brand' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-4 transform rounded-full bg-background shadow transition-transform',
                      generateDocs ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>

                <ul className="mt-6 space-y-3 border-t border-border pt-5">
                  {[
                    ...(generateDocs ? ['Documentation website'] : []),
                    `${selectedLanguages.length || 'No'} SDK ${selectedLanguages.length === 1 ? 'language' : 'languages'}`,
                    ...(generateDocs ? ['Command-line interface'] : []),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        className="size-4 text-brand"
                      >
                        <path
                          d="M3.5 8.5l3 3 6-7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {error && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className={cn('py-8 text-center', stepCls)}>
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
              <h1 className="mt-6 text-2xl font-semibold tracking-tight">
                {name} is generating
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                We&apos;re building your docs, SDKs, and CLI. This usually takes about a minute.
              </p>
              <Button size="lg" className="mt-8" onClick={() => navigate('/dashboard')}>
                Go to dashboard
              </Button>
            </div>
          )}

          {step < 3 && (
            <div className="mt-10 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={step === 0}
              >
                Back
              </Button>
              {step < 2 ? (
                <Button onClick={goNext} disabled={!canContinue}>
                  Continue
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? 'Generating…' : 'Generate'}
                </Button>
              )}
            </div>
          )}
      </div>
  )
}
