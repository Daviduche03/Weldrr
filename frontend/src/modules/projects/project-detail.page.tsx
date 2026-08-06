import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Braces, Globe, RefreshCw, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

const tabs = ['Overview', 'Spec', 'SDKs', 'Docs', 'CLI', 'Settings'] as const

const statusStyles: Record<Project['status'], string> = {
  ready: 'text-emerald-600 dark:text-emerald-400',
  generating: 'text-sky-600 dark:text-sky-400',
  failed: 'text-rose-600 dark:text-rose-400',
}

const statusDots: Record<Project['status'], string> = {
  ready: 'bg-emerald-500',
  generating: 'bg-sky-500',
  failed: 'bg-rose-500',
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between rounded-t-xl border-b border-border bg-card px-6 py-3"
      style={{
        backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      }}
    >
      {children}
    </div>
  )
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview')

  useEffect(() => {
    if (!id) return
    let mounted = true
    api.getProject(id).then((data) => {
      if (mounted) setProject(data ?? null)
    })
    return () => {
      mounted = false
    }
  }, [id])

  if (project === null) {
    return (
      <div className="rounded-2xl border border-border bg-background p-12 text-center">
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-6 sm:px-8">
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Projects
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium capitalize',
                statusStyles[project.status],
              )}
            >
              <span className={cn('size-1.5 rounded-full', statusDots[project.status])} />
              {project.status}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw />
          Regenerate
        </Button>
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

      <div className="mt-6">
        {tab === 'Overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                <PanelHeader>
                  <h2 className="text-sm font-medium text-muted-foreground">Status</h2>
                </PanelHeader>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground">
                    {project.status === 'ready' &&
                      'Your docs, SDKs, and CLI are up to date and ready to use.'}
                    {project.status === 'generating' &&
                      'We are regenerating artifacts from your latest spec.'}
                    {project.status === 'failed' &&
                      'Generation failed. Check your spec and try again.'}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                <PanelHeader>
                  <h2 className="text-sm font-medium text-muted-foreground">Spec</h2>
                </PanelHeader>
                <div className="grid grid-cols-3 gap-px bg-border">
                  {[
                    { label: 'Type', value: project.specType.toUpperCase() },
                    { label: 'Source', value: project.specSource },
                    {
                      label: 'Last updated',
                      value: new Date(project.updatedAt).toLocaleDateString(),
                    },
                  ].map((row) => (
                    <div key={row.label} className="bg-background p-4">
                      <div className="text-xs text-muted-foreground">{row.label}</div>
                      <div className="mt-1 font-mono text-sm capitalize">{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <PanelHeader>
                <h2 className="text-sm font-medium text-muted-foreground">Artifacts</h2>
              </PanelHeader>
              <div className="divide-y divide-border">
                <a
                  href={project.docsUrl || '#'}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <Globe className="size-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium">Docs site</div>
                    <div className="text-xs text-muted-foreground">
                      {project.docsUrl || 'Not published yet'}
                    </div>
                  </div>
                </a>
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <Braces className="size-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium">SDKs</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {project.sdkLanguages.length
                        ? project.sdkLanguages.join(' · ')
                        : 'Not generated yet'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <Terminal className="size-4" />
                  </span>
                  <div>
                    <div className="text-sm font-medium">CLI</div>
                    <div className="text-xs text-muted-foreground">
                      {project.cliEnabled ? 'Available' : 'Not enabled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Spec' && (
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <PanelHeader>
              <h2 className="text-sm font-medium text-muted-foreground">
                {project.name} · spec
              </h2>
            </PanelHeader>
            <div className="bg-[#0f0f11] p-6 font-mono text-sm text-white/85">
              <pre>{`openapi: 3.1.0
info:
  title: ${project.name}
  version: 1.0.0
paths: {}`}</pre>
            </div>
          </div>
        )}

        {(tab === 'SDKs' || tab === 'Docs' || tab === 'CLI') && (
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <PanelHeader>
              <h2 className="text-sm font-medium text-muted-foreground">{tab}</h2>
            </PanelHeader>
            <div className="flex flex-col items-center p-14 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                {tab === 'SDKs' ? (
                  <Braces className="size-6" />
                ) : tab === 'Docs' ? (
                  <BookOpen className="size-6" />
                ) : (
                  <Terminal className="size-6" />
                )}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {tab} artifacts
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {tab} artifacts for {project.name} will appear here once generation is
                complete.
              </p>
            </div>
          </div>
        )}

        {tab === 'Settings' && (
          <div className="max-w-md overflow-hidden rounded-2xl border border-border bg-background">
            <PanelHeader>
              <h2 className="text-sm font-medium text-muted-foreground">Project settings</h2>
            </PanelHeader>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Name</label>
                <input
                  defaultValue={project.name}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                />
              </div>
              <Button size="sm">Save</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
