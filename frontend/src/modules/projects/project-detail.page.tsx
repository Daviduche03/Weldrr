import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

const tabs = ['Overview', 'Spec', 'SDKs', 'Docs', 'CLI', 'Settings'] as const

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Projects
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <Button variant="outline" size="sm">
          Regenerate
        </Button>
      </div>

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

      <div className="mt-8">
        {tab === 'Overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-border bg-background p-6">
                <h2 className="text-lg font-semibold tracking-tight">Status</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {project.status === 'ready' &&
                    'Your docs, SDKs, and CLI are up to date and ready to use.'}
                  {project.status === 'generating' &&
                    'We are regenerating artifacts from your latest spec.'}
                  {project.status === 'failed' &&
                    'Generation failed. Check your spec and try again.'}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <h2 className="text-lg font-semibold tracking-tight">Spec</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-mono uppercase">{project.specType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Source</span>
                    <span className="capitalize">{project.specSource}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Last updated</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-background p-6">
                <h2 className="text-lg font-semibold tracking-tight">Artifacts</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <a
                    href={project.docsUrl || '#'}
                    className="block rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    Docs site
                  </a>
                  <div className="rounded-lg border border-border px-3 py-2.5">
                    {project.sdkLanguages.length
                      ? project.sdkLanguages.map((l) => l).join(', ')
                      : '—'}
                  </div>
                  <div className="rounded-lg border border-border px-3 py-2.5">
                    {project.cliEnabled ? 'CLI available' : 'CLI disabled'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Spec' && (
          <div className="rounded-2xl border border-border bg-background p-8 font-mono text-sm text-muted-foreground">
            <pre>{`openapi: 3.1.0
info:
  title: ${project.name}
  version: 1.0.0
paths: {}`}</pre>
          </div>
        )}

        {(tab === 'SDKs' || tab === 'Docs' || tab === 'CLI') && (
          <div className="rounded-2xl border border-border bg-background p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {tab} artifacts for {project.name} will appear here once generation is complete.
            </p>
          </div>
        )}

        {tab === 'Settings' && (
          <div className="max-w-md rounded-2xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold tracking-tight">Project settings</h2>
            <div className="mt-4 space-y-4">
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
