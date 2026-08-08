import { useState } from 'react'
import { Check, ExternalLink, LoaderCircle, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandingSection } from '@/modules/projects/docs-editor/branding-section'
import type { ArtifactVersion, Project, Sdk } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusMeta: Record<Project['status'], { label: string; dot: string }> = {
  ready: { label: 'Ready', dot: 'bg-emerald-500' },
  generating: { label: 'Building', dot: 'bg-sky-500' },
  failed: { label: 'Failed', dot: 'bg-rose-500' },
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm text-foreground">{children}</dd>
    </div>
  )
}

export function ProjectSettings({
  project,
  versions,
  sdks,
  onSaveName,
  onChangePublishMode,
  onDelete,
  saving,
  deleting,
}: {
  project: Project
  versions: ArtifactVersion[]
  sdks: Sdk[]
  onSaveName: (name: string) => Promise<void>
  onChangePublishMode: (mode: 'automerge' | 'pr') => Promise<void>
  onDelete: () => void
  saving: boolean
  deleting: boolean
}) {
  const [name, setName] = useState(project.name)
  const [saved, setSaved] = useState(false)
  const [publishSaved, setPublishSaved] = useState(false)
  const [publishSaving, setPublishSaving] = useState(false)
  const meta = statusMeta[project.status]

  const saveName = async () => {
    if (!name.trim() || name.trim() === project.name) return
    await onSaveName(name.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const changePublishMode = async (mode: 'automerge' | 'pr') => {
    if (mode === project.publishMode || publishSaving) return
    setPublishSaving(true)
    try {
      await onChangePublishMode(mode)
      setPublishSaved(true)
      setTimeout(() => setPublishSaved(false), 2500)
    } finally {
      setPublishSaving(false)
    }
  }

  const docsVersion = versions.find((v) => v.artifactType === 'docs')
  const sdkVersion = versions.find((v) => v.artifactType === 'sdk')
  const repoFullName = project.gitRepo?.fullName ?? project.docsUrl

  return (
    <div className="max-w-4xl">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.name} · manage identity, branding, and lifecycle.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className={cn('size-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </div>

      {/* General */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-foreground">General</h2>
        <div className="mt-4 border-t border-border">
          <div className="py-6">
            <label htmlFor="project-name" className="block text-sm font-medium">
              Project name
            </label>
            <div className="mt-2 flex max-w-md items-center gap-2">
              <input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void saveName()}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-[border,box-shadow] focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              />
              <Button
                size="sm"
                onClick={() => void saveName()}
                disabled={saving || name.trim() === project.name}
                className="shrink-0"
              >
                {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save
              </Button>
              {saved && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5" /> Saved
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              The name shown across Weldrr and your generated docs.
            </p>
          </div>

          <div className="border-t border-border py-6">
            <label className="block text-sm font-medium">Publishing</label>
            <p className="mt-1 text-sm text-muted-foreground">
              How generated changes reach your team before they ship.
            </p>
            <div className="mt-4 grid max-w-md gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void changePublishMode('automerge')}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left transition-colors',
                  project.publishMode === 'automerge'
                    ? 'border-ring bg-accent'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="text-sm font-medium">Auto-merge</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Push generated changes straight to main. Fast, no review.
                </div>
              </button>
              <button
                type="button"
                onClick={() => void changePublishMode('pr')}
                className={cn(
                  'rounded-lg border px-4 py-3 text-left transition-colors',
                  project.publishMode === 'pr'
                    ? 'border-ring bg-accent'
                    : 'border-border hover:bg-muted',
                )}
              >
                <div className="text-sm font-medium">Pull request</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Open a PR for every change. Reviewed before merge.
                </div>
              </button>
            </div>
            {publishSaving ? (
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <LoaderCircle className="size-3 animate-spin" /> Saving…
              </span>
            ) : publishSaved ? (
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Saved
              </span>
            ) : null}
          </div>

          <dl className="grid gap-x-10 border-t border-border sm:grid-cols-2">
            <Meta label="Source">{project.specSource}</Meta>
            <Meta label="Spec type">
              <span className="font-mono">{project.specType}</span>
            </Meta>
            {project.sdkLanguages.length > 0 && (
              <Meta label="SDK languages">
                {project.sdkLanguages.map((l) => l[0].toUpperCase() + l.slice(1)).join(', ')}
              </Meta>
            )}
            <Meta label="Created">{new Date(project.createdAt).toLocaleDateString()}</Meta>
            <Meta label="Docs version">
              <span className="font-mono">v{docsVersion?.version ?? project.docsVersion ?? '—'}</span>
            </Meta>
            <Meta label="SDK version">
              <span className="font-mono">v{sdkVersion?.version ?? project.sdkVersion ?? '—'}</span>
            </Meta>
            <Meta label="Packages">{sdks.length}</Meta>
            {repoFullName && (
              <Meta label="Repository">
                <a
                  href={project.docsUrl || `https://github.com/${repoFullName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-foreground transition-opacity hover:opacity-70"
                >
                  <span className="truncate">{repoFullName}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </Meta>
            )}
          </dl>
        </div>
      </section>

      {/* Branding */}
      {project.docsUrl && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-foreground">Branding</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize your published docs — logo, colors, font, and images.
          </p>
          <div className="mt-4 border-t border-border pt-2">
            <BrandingSection projectId={project.id} />
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
        <div className="mt-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Delete this project</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Permanently removes {project.name} and all generated artifacts, versions, and build history.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={deleting}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {deleting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete project
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
