import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Braces,
  Check,
  ExternalLink,
  FileQuestion,
  GitBranch,
  Globe,
  History,
  LoaderCircle,
  Package,
  RefreshCw,
  Rocket,
  Terminal,
  Trash2,
} from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { projectApi, sdkApi, sandboxApi, versionApi } from '@/lib/api'
import { DocsEditor } from '@/modules/projects/docs-editor/docs-editor'
import type {
  ArtifactVersion,
  Discovery,
  Project,
  Sandbox,
  Sdk,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAsyncData } from '@/lib/hooks'

const tabs = ['Overview', 'Docs', 'SDKs', 'CLI', 'Settings'] as const

const statusMeta: Record<Project['status'], { label: string; dot: string }> = {
  ready: { label: 'Ready', dot: 'bg-emerald-500' },
  generating: { label: 'Building', dot: 'bg-sky-500' },
  failed: { label: 'Failed', dot: 'bg-rose-500' },
}

const sdkStatusMeta: Record<Sdk['status'], { label: string; dot: string }> = {
  draft: { label: 'Draft', dot: 'bg-muted-foreground' },
  generating: { label: 'Generating', dot: 'bg-sky-500' },
  ready: { label: 'Ready', dot: 'bg-emerald-500' },
  failed: { label: 'Failed', dot: 'bg-rose-500' },
}

const buildStatusMeta: Record<Sandbox['status'], { label: string; dot: string }> = {
  issuing: { label: 'Issuing', dot: 'bg-sky-500' },
  starting: { label: 'Starting', dot: 'bg-sky-500' },
  ready: { label: 'Provisioned', dot: 'bg-sky-500' },
  building: { label: 'Building', dot: 'bg-sky-500' },
  finished: { label: 'Published', dot: 'bg-emerald-500' },
  failed: { label: 'Failed', dot: 'bg-rose-500' },
  terminated: { label: 'Stopped', dot: 'bg-muted-foreground' },
}

const methodColors: Record<string, string> = {
  GET: 'text-emerald-600 dark:text-emerald-400',
  POST: 'text-sky-600 dark:text-sky-400',
  PUT: 'text-amber-600 dark:text-amber-400',
  PATCH: 'text-violet-600 dark:text-violet-400',
  DELETE: 'text-rose-600 dark:text-rose-400',
}

const languageLabels: Record<string, string> = {
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go',
  java: 'Java',
  ruby: 'Ruby',
  php: 'PHP',
  kotlin: 'Kotlin',
  swift: 'Swift',
  rust: 'Rust',
  csharp: 'C#',
}

function Card({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-border bg-background', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-[13px] font-medium text-foreground">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function VersionChip({ version }: { version: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
      <span className="text-muted-foreground">v</span>
      {version}
    </span>
  )
}

function StatusLabel({ label, dot }: { label: string; dot: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function DetailSkeleton() {
  return (
    <div className="px-6 sm:px-8">
      <Skeleton className="h-4 w-16" />
      <div className="mt-4 flex items-center gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishingDocs, setPublishingDocs] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [latestBuild, setLatestBuild] = useState<Sandbox | null>(null)
  const [docsBuild, setDocsBuild] = useState<Sandbox | null>(null)

  const { data: project, error, reload } = useAsyncData<Project | null>(
    useCallback(() => (id ? projectApi.get(id) : Promise.resolve(null)), [id]),
    [id],
  )

  const { data: discovery } = useAsyncData<Discovery | null>(
    useCallback(() => (id ? projectApi.discovery(id) : Promise.resolve(null)), [id]),
    [id],
  )

  const { data: versions, reload: reloadVersions } = useAsyncData<ArtifactVersion[]>(
    useCallback(() => (id ? versionApi.list(id) : Promise.resolve([])), [id]),
    [id],
  )

  const { data: sdks, reload: reloadSdks } = useAsyncData<Sdk[]>(
    useCallback(() => (id ? sdkApi.list(id) : Promise.resolve([])), [id]),
    [id],
  )

  useEffect(() => {
    if (project) setName(project.name)
  }, [project])

  const sdkList = sdks ?? []
  const versionList = useMemo(() => versions ?? [], [versions])
  const primaryLanguage = project?.sdkLanguages[0] ?? 'typescript'

  const sdkVersion = useMemo(
    () => versionList.find((v) => v.artifactType === 'sdk'),
    [versionList],
  )

  const endpointSummary = useMemo(() => {
    if (!discovery?.endpoints) return { total: 0, byMethod: {} as Record<string, number> }
    const byMethod: Record<string, number> = {}
    for (const ep of discovery.endpoints) {
      byMethod[ep.method] = (byMethod[ep.method] ?? 0) + 1
    }
    return { total: discovery.endpoints.length, byMethod }
  }, [discovery])

  const pollLatestBuild = useCallback(async () => {
    if (!id) return
    try {
      const list = await sandboxApi.list({ projectId: id, jobType: 'sdk' })
      const active = list.find((s) => ['issuing', 'starting', 'ready', 'building'].includes(s.status))
      const latest = active ?? list[0] ?? null
      setLatestBuild(latest)
      return latest
    } catch {
      return null
    }
  }, [id])

  const pollDocsBuild = useCallback(async () => {
    if (!id) return
    try {
      const list = await sandboxApi.list({ projectId: id, jobType: 'docs' })
      const active = list.find((s) => ['issuing', 'starting', 'ready', 'building'].includes(s.status))
      const latest = active ?? list[0] ?? null
      setDocsBuild(latest)
      return latest
    } catch {
      return null
    }
  }, [id])

  useEffect(() => {
    void pollLatestBuild()
    void pollDocsBuild()
  }, [pollLatestBuild, pollDocsBuild, id])

  const publishSdk = async () => {
    if (!project || publishing) return
    setPublishing(true)
    try {
      const sandbox = await sandboxApi.issue({
        projectId: project.id,
        jobType: 'sdk',
        language: primaryLanguage,
      })
      await sandboxApi.start(
        sandbox.id,
        [
          `Build a production-grade ${languageLabels[primaryLanguage] ?? primaryLanguage} SDK from the API surface in /workspace/docs.md.`,
          'Follow the sdk-builder skill, including the versioning steps: set the package version from WELDRR_ARTIFACT_VERSION, commit, push, and tag.',
          'Implement typed clients for every listed endpoint, add a smoke test, and ensure lint/tests pass.',
          'Do not implement anything in the excluded internal section.',
        ].join(' '),
      )
      await pollLatestBuild()
    } finally {
      setPublishing(false)
    }
  }

  const publishDocs = async () => {
    if (!project || publishingDocs) return
    setPublishingDocs(true)
    try {
      const sandbox = await sandboxApi.issue({ projectId: project.id, jobType: 'docs' })
      await sandboxApi.start(
        sandbox.id,
        [
          'Build the API documentation site from /workspace/docs.md and /workspace/spec.json.',
          'Follow the docs-builder skill: populate the template pages, create a reference page per resource, and verify the build.',
          'Include the versioning steps: commit, push, and tag with WELDRR_ARTIFACT_VERSION.',
          'Do not document anything in the excluded internal section.',
        ].join(' '),
      )
      await pollDocsBuild()
    } finally {
      setPublishingDocs(false)
    }
  }

  // Poll the latest builds while in-flight, then refresh versions on completion.
  useEffect(() => {
    if (!id) return
    const active = latestBuild && ['issuing', 'starting', 'ready', 'building'].includes(latestBuild.status)
      ? latestBuild
      : docsBuild && ['issuing', 'starting', 'ready', 'building'].includes(docsBuild.status)
        ? docsBuild
        : null
    if (!active) return
    const timer = setInterval(async () => {
      const [sdkNext, docsNext] = await Promise.all([pollLatestBuild(), pollDocsBuild()])
      const done =
        (sdkNext && ['finished', 'failed', 'terminated'].includes(sdkNext.status)) ||
        (docsNext && ['finished', 'failed', 'terminated'].includes(docsNext.status))
      if (done) {
        clearInterval(timer)
        reload()
        reloadVersions()
      }
    }, 8000)
    return () => clearInterval(timer)
  }, [id, latestBuild, docsBuild, pollLatestBuild, pollDocsBuild, reload, reloadVersions])

  const handleRegenerate = async () => {
    if (!project) return
    await projectApi.update(project.id, { status: 'generating' })
    reload()
  }

  const handleSaveName = async () => {
    if (!project || saving) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === project.name) return
    setSaving(true)
    try {
      await projectApi.update(project.id, { name: trimmed })
      reload()
    } finally {
      setSaving(false)
    }
  }

  const addSdk = async (language: string) => {
    if (!id) return
    await sdkApi.create(id, { name: languageLabels[language] ?? language, language: language as Sdk['language'] })
    reloadSdks()
  }

  const removeSdk = async (sdk: Sdk) => {
    if (!id) return
    await sdkApi.remove(id, sdk.id)
    reloadSdks()
  }

  const handleDeleteProject = async () => {
    if (!id || deleting) return
    setDeleting(true)
    try {
      await projectApi.remove(id)
      window.location.assign('/projects')
    } finally {
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <EmptyState
        icon={<FileQuestion className="size-6" />}
        title="Project not found"
        description="It may have been deleted, or the link is incorrect."
        action={
          <Button size="lg" asChild>
            <Link to="/projects">Back to projects</Link>
          </Button>
        }
      />
    )
  }

  if (!project) return <DetailSkeleton />

  const status = statusMeta[project.status]

  return (
    <div className="px-6 sm:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Projects
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {project.name}
            </h1>
            <StatusLabel label={status.label} dot={status.dot} />
            {project.sdkVersion && <VersionChip version={project.sdkVersion} />}
            {project.docsVersion && <VersionChip version={project.docsVersion} />}
            {project.gitRepo && (
              <a
                href={`https://github.com/${project.gitRepo.fullName}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <GitBranch className="size-3.5" />
                {project.gitRepo.fullName}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleRegenerate}
            className="text-muted-foreground"
          >
            <RefreshCw className={cn(project.status === 'generating' && 'animate-spin')} />
            Re-run discovery
          </Button>
          <Button onClick={publishSdk} disabled={publishing || !project.sdkLanguages.length && !project.gitRepo}>
            <Rocket />
            {publishing ? 'Publishing…' : 'Publish SDK'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
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

      <div className="mt-6">
        {tab === 'Overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">
              <Card
                title="API surface"
                action={
                  discovery ? (
                    <span className="text-xs text-muted-foreground">
                      {endpointSummary.total} endpoints
                    </span>
                  ) : undefined
                }
              >
                {!discovery ? (
                  <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading endpoints…
                  </div>
                ) : discovery.status === 'failed' ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-rose-600 dark:text-rose-400">Discovery failed.</p>
                    <p className="mt-1 text-xs text-muted-foreground">{discovery.error}</p>
                  </div>
                ) : discovery.endpoints.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No endpoints extracted yet. Run discovery to analyze your spec.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="px-5 py-2.5 font-medium">Method</th>
                          <th className="px-5 py-2.5 font-medium">Endpoint</th>
                          <th className="px-5 py-2.5 font-medium">Summary</th>
                        </tr>
                      </thead>
                      <tbody className="max-h-[22rem] overflow-y-auto divide-y divide-border">
                        {discovery.endpoints.map((ep, i) => (
                          <tr key={i} className="hover:bg-muted/50">
                            <td className="px-5 py-2.5 align-top">
                              <span
                                className={cn(
                                  'font-mono text-xs font-semibold',
                                  methodColors[ep.method] ?? 'text-muted-foreground',
                                )}
                              >
                                {ep.method}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 align-top font-mono text-[13px]">
                              {ep.path}
                            </td>
                            <td className="px-5 py-2.5 align-top text-[13px] text-muted-foreground">
                              {ep.summary ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title="Project">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
                  {[
                    { label: 'Spec type', value: project.specType.toUpperCase() },
                    { label: 'Source', value: project.specSource },
                    { label: 'Docs version', value: project.docsVersion ? `v${project.docsVersion}` : '—' },
                    { label: 'SDK version', value: project.sdkVersion ? `v${project.sdkVersion}` : '—' },
                    { label: 'Updated', value: formatDate(project.updatedAt) },
                    { label: 'Created', value: formatDate(project.createdAt) },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs text-muted-foreground">{row.label}</dt>
                      <dd className="mt-1 font-mono text-[13px] capitalize">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <Card title="Artifacts">
                <div className="divide-y divide-border">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <Package className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        SDK{' '}
                        <span className="text-muted-foreground">· {languageLabels[primaryLanguage]}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {latestBuild ? (
                          <StatusLabel
                            label={buildStatusMeta[latestBuild.status].label}
                            dot={buildStatusMeta[latestBuild.status].dot}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {project.sdkVersion ? `v${project.sdkVersion} published` : 'Not generated yet'}
                          </span>
                        )}
                        {sdkVersion?.artifactUrl && (
                          <a
                            href={sdkVersion.artifactUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <GitBranch className="size-3" />
                            repo
                          </a>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={publishSdk} disabled={publishing}>
                      <Rocket />
                      {publishing ? 'Publishing…' : 'Publish'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <Globe className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">Docs</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {docsBuild ? (
                          <StatusLabel
                            label={buildStatusMeta[docsBuild.status].label}
                            dot={buildStatusMeta[docsBuild.status].dot}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {project.docsVersion ? `v${project.docsVersion}` : 'Not published yet'}
                          </span>
                        )}
                        {project.docsUrl && (
                          <a
                            href={project.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <GitBranch className="size-3" />
                            repo
                          </a>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={publishDocs} disabled={publishingDocs}>
                      <Rocket />
                      {publishingDocs ? 'Publishing…' : 'Publish'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <Terminal className="size-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium">CLI</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {project.cliEnabled ? 'Available' : 'Not enabled'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                title="Versions"
                action={
                  <History className="size-4 text-muted-foreground" />
                }
              >
                {versionList.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No versions published yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {versionList.slice(0, 6).map((v) => (
                      <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex size-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground',
                            v.artifactType === 'sdk' ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          {v.artifactType === 'sdk' ? (
                            <Package className="size-3.5" />
                          ) : (
                            <BookOpen className="size-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[13px] font-medium">v{v.version}</span>
                            <span className="text-xs capitalize text-muted-foreground">
                              {v.artifactType}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(v.createdAt)}
                          </div>
                        </div>
                        {v.artifactUrl && (
                          <a
                            href={v.artifactUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={`Open version ${v.version}`}
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}

        {tab === 'Docs' && (
          <div className="space-y-4">
            {!discovery || discovery.status === 'failed' ? (
              <Card
                title={`${project.name} · docs`}
                action={
                  project.docsUrl ? (
                    <a
                      href={project.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-muted"
                    >
                      Open docs
                      <ExternalLink className="size-4" />
                    </a>
                  ) : undefined
                }
              >
                {!discovery ? (
                  <div className="grid h-96 grid-cols-[16rem_1fr_20rem] gap-0 p-4">
                    <div className="space-y-2 border-r border-border pr-4">
                      <Skeleton className="h-4 w-20" />
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className={cn('h-5', i % 3 === 0 ? 'w-4/5' : i % 3 === 1 ? 'w-3/5' : 'w-2/3')} />
                      ))}
                    </div>
                    <div className="space-y-3 px-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                    <div className="hidden space-y-3 border-l border-border pl-4 lg:block">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileQuestion className="size-6" />}
                    title="Docs couldn't be generated"
                    description={discovery.error ?? 'Discovery failed for this project.'}
                  />
                )}
              </Card>
            ) : (
              <DocsEditor
                projectId={project.id}
                docsUrl={project.docsUrl}
                onPublished={() => {
                  void reload()
                  void reloadVersions()
                }}
              />
            )}
          </div>
        )}

        {tab === 'SDKs' && (
          <Card title="SDKs" action={<span className="text-xs text-muted-foreground">{sdkList.length} total</span>}>
            {sdkList.length === 0 ? (
              <EmptyState
                icon={<Braces className="size-6" />}
                title="No SDKs yet"
                description="Generate an SDK in the language your users need."
              />
            ) : (
              <ul className="divide-y divide-border">
                {sdkList.map((sdk) => {
                  const meta = sdkStatusMeta[sdk.status]
                  return (
                    <li key={sdk.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{sdk.name}</div>
                        <div className="text-xs capitalize text-muted-foreground">
                          {languageLabels[sdk.language] ?? sdk.language}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <StatusLabel label={meta.label} dot={meta.dot} />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Remove ${sdk.name}`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeSdk(sdk)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="border-t border-border px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(languageLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => addSdk(key)}
                    disabled={project.sdkLanguages.includes(key)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      project.sdkLanguages.includes(key)
                        ? 'cursor-not-allowed border-border text-muted-foreground/50'
                        : 'cursor-pointer border-border text-muted-foreground hover:border-ring hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {tab === 'CLI' && (
          <Card title="CLI">
            {!project.cliEnabled ? (
              <EmptyState
                icon={<Terminal className="size-6" />}
                title="CLI not enabled"
                description="Enable the CLI to let users interact with your API from the terminal."
              />
            ) : (
              <div className="space-y-6 p-6">
                <div>
                  <h3 className="text-sm font-medium">Install</h3>
                  <div className="mt-2 rounded-lg bg-[#0f0f11] px-4 py-3 font-mono text-sm text-white/85">
                    npm install -g @weldrr/cli
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Authenticate</h3>
                  <div className="mt-2 rounded-lg bg-[#0f0f11] px-4 py-3 font-mono text-sm text-white/85">
                    weldrr login
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Use {project.name}</h3>
                  <div className="mt-2 rounded-lg bg-[#0f0f11] px-4 py-3 font-mono text-sm text-white/85">
                    <div>weldrr use {project.specType}</div>
                    <div className="mt-1 text-white/60">weldrr call users.list --limit 10</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {tab === 'Settings' && (
          <div className="max-w-2xl space-y-6">
            <Card title="Project settings">
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={handleSaveName} disabled={saving || name.trim() === project.name}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  {!saving && name.trim() === project.name && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                      <Check className="size-3.5" />
                      Saved
                    </span>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Danger zone">
              <div className="flex flex-wrap items-center justify-between gap-3 p-6">
                <div className="text-sm text-muted-foreground">
                  Permanently delete this project and all generated artifacts.
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 />
                  Delete project
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setConfirmDelete(false)
        }}
        title="Delete project?"
        description={`This permanently deletes "${project.name}" and all its generated artifacts, versions, and build history. This cannot be undone.`}
        icon={<Trash2 className="size-6" />}
        tone="danger"
        confirmLabel="Delete project"
        loading={deleting}
        onConfirm={handleDeleteProject}
      />
    </div>
  )
}
