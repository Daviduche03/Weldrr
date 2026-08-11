import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Braces,
  ExternalLink,
  FileQuestion,
  GitBranch,
  RefreshCw,
  Rocket,
  Trash2,
} from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DocsEditor } from '@/modules/projects/docs-editor/docs-editor'
import { SdkViewer } from '@/modules/projects/docs-editor/sdk-viewer'
import { ProjectSettings } from '@/modules/projects/project-settings'
import { ProjectOverview } from '@/modules/projects/project-overview'
import {
  useProject,
  useDiscovery,
  useVersions,
  useSdks,
  useSandboxes,
  useUpdateProject,
  useRemoveProject,
  useRerunDiscovery,
  useIssueSandbox,
  useStartSandbox,
  useAddSdk,
  useRemoveSdk,
  queryKeys,
} from '@/lib/queries'
import type {
  Project,
  Sandbox,
  Sdk,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const tabs = ['Overview', 'Docs', 'SDKs', 'Settings'] as const

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

export function formatTime(iso: string): string {
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
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishingDocs, setPublishingDocs] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewingSdkLang, setViewingSdkLang] = useState<Sdk['language'] | null>(null)

  const projectQuery = useProject(id)
  const discoveryQuery = useDiscovery(id)
  const versionsQuery = useVersions(id)
  const sdksQuery = useSdks(id)
  const sdkBuildsQuery = useSandboxes(id ? { projectId: id, jobType: 'sdk' } : undefined)
  const docsBuildsQuery = useSandboxes(id ? { projectId: id, jobType: 'docs' } : undefined)

  const project = projectQuery.data ?? null
  const error = projectQuery.error as Error | null
  const discovery = discoveryQuery.data ?? null
  const versions = versionsQuery.data
  const sdks = sdksQuery.data
  const sdkBuilds = sdkBuildsQuery.data ?? []
  const docsBuilds = docsBuildsQuery.data ?? []

  const latestBuild = useMemo<Sandbox | null>(() => {
    const active = sdkBuilds.find((s) => ['issuing', 'starting', 'ready', 'building'].includes(s.status))
    return active ?? sdkBuilds[0] ?? null
  }, [sdkBuilds])

  const docsBuild = useMemo<Sandbox | null>(() => {
    const active = docsBuilds.find((s) => ['issuing', 'starting', 'ready', 'building'].includes(s.status))
    return active ?? docsBuilds[0] ?? null
  }, [docsBuilds])

  // Poll sandboxes every few seconds while a build is in flight; refresh
  // project + versions once a build reaches a terminal state.
  const buildActive =
    (latestBuild && ['issuing', 'starting', 'ready', 'building'].includes(latestBuild.status)) ||
    (docsBuild && ['issuing', 'starting', 'ready', 'building'].includes(docsBuild.status))

  useEffect(() => {
    if (!buildActive) return
    const timer = setInterval(() => {
      const sdkDone = latestBuild && ['finished', 'failed', 'terminated'].includes(latestBuild.status)
      const docsDone = docsBuild && ['finished', 'failed', 'terminated'].includes(docsBuild.status)
      if (sdkDone || docsDone) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.project(id ?? '') })
        void queryClient.invalidateQueries({ queryKey: queryKeys.projectVersions(id ?? '') })
      }
    }, 8000)
    return () => clearInterval(timer)
  }, [buildActive, latestBuild, docsBuild, id, queryClient])

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

  const updateProject = useUpdateProject()
  const removeProject = useRemoveProject()
  const rerunDiscovery = useRerunDiscovery()
  const issueSandbox = useIssueSandbox()
  const startSandbox = useStartSandbox()
  const addSdkMutation = useAddSdk()
  const removeSdkMutation = useRemoveSdk()

  const publishSdk = async () => {
    if (!project || publishing) return
    setPublishing(true)
    try {
      const sandbox = await issueSandbox.mutateAsync({
        projectId: project.id,
        jobType: 'sdk',
        language: primaryLanguage,
      })
      await startSandbox.mutateAsync({
        id: sandbox.id,
        prompt: [
          `Build a production-grade ${languageLabels[primaryLanguage] ?? primaryLanguage} SDK from the API surface in /workspace/docs.md.`,
          'Follow the sdk-builder skill, including the versioning steps: set the package version from WELDRR_ARTIFACT_VERSION, commit, push, and tag.',
          'Implement typed clients for every listed endpoint, add a smoke test, and ensure lint/tests pass.',
          'Do not implement anything in the excluded internal section.',
        ].join(' '),
      })
    } finally {
      setPublishing(false)
    }
  }

  const publishDocs = async () => {
    if (!project || publishingDocs) return
    setPublishingDocs(true)
    try {
      const sandbox = await issueSandbox.mutateAsync({ projectId: project.id, jobType: 'docs' })
      await startSandbox.mutateAsync({
        id: sandbox.id,
        prompt: [
          'Build the API documentation site from /workspace/docs.md and /workspace/spec.json.',
          'Follow the docs-builder skill: populate the template pages, create a reference page per resource, and verify the build.',
          'Include the versioning steps: commit, push, and tag with WELDRR_ARTIFACT_VERSION.',
          'Do not document anything in the excluded internal section.',
        ].join(' '),
      })
    } finally {
      setPublishingDocs(false)
    }
  }

  const handleRegenerate = async () => {
    if (!project) return
    await Promise.all([
      updateProject.mutateAsync({ id: project.id, input: { status: 'generating' } }),
      rerunDiscovery.mutateAsync(project.id),
    ])
  }

  const handleSaveName = async (nextName: string) => {
    if (!project || saving) return
    const trimmed = nextName.trim()
    if (!trimmed || trimmed === project.name) return
    setSaving(true)
    try {
      await updateProject.mutateAsync({ id: project.id, input: { name: trimmed } })
      setName(trimmed)
    } finally {
      setSaving(false)
    }
  }

  const addSdk = async (language: string) => {
    if (!id) return
    await addSdkMutation.mutateAsync({
      projectId: id,
      name: languageLabels[language] ?? language,
      language: language as Sdk['language'],
    })
  }

  const removeSdk = async (sdk: Sdk) => {
    if (!id) return
    await removeSdkMutation.mutateAsync({ projectId: id, id: sdk.id })
  }

  const handleDeleteProject = async () => {
    if (!id || deleting) return
    setDeleting(true)
    try {
      await removeProject.mutateAsync(id)
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
        <div className={cn(tab === 'Overview' ? '' : 'hidden')}>
          {/* Metrics dashboard */}
          <ProjectOverview
            project={project}
            endpoints={discovery?.endpoints ?? []}
            sdks={sdkList}
            versions={versionList}
            builds={[...sdkBuilds, ...docsBuilds]}
          />

          {/* Publish artifacts */}
          <section className="mt-10 max-w-2xl">
            <h2 className="text-sm font-semibold text-foreground">Artifacts</h2>
            <div className="mt-3 divide-y divide-border border-t border-border">
              <div className="flex items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    SDK <span className="text-muted-foreground">· {languageLabels[primaryLanguage]}</span>
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

              <div className="flex items-center gap-3 py-4">
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
            </div>
          </section>
        </div>

        <div className={cn(tab === 'Docs' ? '' : 'hidden')}>
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
                  void queryClient.invalidateQueries({ queryKey: queryKeys.project(id ?? '') })
                  void queryClient.invalidateQueries({ queryKey: queryKeys.projectVersions(id ?? '') })
                }}
              />
            )}
          </div>
        </div>

        <div className={cn(tab === 'SDKs' ? '' : 'hidden')}>
          {viewingSdkLang ? (
            <SdkViewer
              projectId={project.id}
              language={viewingSdkLang}
              repoUrl={sdkVersion?.artifactUrl ?? null}
              onBack={() => setViewingSdkLang(null)}
            />
          ) : (
            <Card title="SDKs" action={<span className="text-xs text-muted-foreground">{project.sdkLanguages.length} language{project.sdkLanguages.length === 1 ? '' : 's'}</span>}>
              {project.sdkLanguages.length === 0 ? (
                <EmptyState
                  icon={<Braces className="size-6" />}
                  title="No SDKs yet"
                  description="Generate an SDK in the language your users need."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {project.sdkLanguages.map((lang) => {
                    const sdk = sdkList.find((s) => s.language === lang)
                    const meta = sdk ? sdkStatusMeta[sdk.status] : sdkStatusMeta.draft
                    return (
                      <li key={lang} className="flex items-center justify-between gap-4 px-5 py-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{languageLabels[lang] ?? lang}</div>
                          <div className="text-xs capitalize text-muted-foreground">
                            {languageLabels[lang] ?? lang}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <StatusLabel label={meta.label} dot={meta.dot} />
                          <Button size="sm" variant="outline" onClick={() => setViewingSdkLang(lang as Sdk['language'])}>
                            View source
                          </Button>
                          {sdk && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Remove ${sdk.name}`}
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeSdk(sdk)}
                            >
                              <Trash2 />
                            </Button>
                          )}
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
        </div>

        <div className={cn(tab === 'Settings' ? '' : 'hidden')}>
          <ProjectSettings
            project={project}
            versions={versionList}
            sdks={sdkList}
            onSaveName={handleSaveName}
            onChangePublishMode={async (mode) => {
              await updateProject.mutateAsync({ id: project.id, input: { publishMode: mode } })
            }}
            onDelete={() => setConfirmDelete(true)}
            saving={saving}
            deleting={deleting}
          />
        </div>
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
