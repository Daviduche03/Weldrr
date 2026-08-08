import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CircleAlert, FolderPlus, RefreshCw, Search, SearchX } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjects } from '@/lib/queries'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusMeta: Record<Project['status'], { label: string; dot: string }> = {
  ready: { label: 'Ready', dot: 'bg-emerald-500' },
  generating: { label: 'Generating', dot: 'bg-sky-500' },
  failed: { label: 'Failed', dot: 'bg-rose-500' },
}

const specStyles: Record<Project['specType'], string> = {
  openapi: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  graphql: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  grpc: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  asyncapi: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function RowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-40" />
      </td>
      <td className="border-l border-border px-6 py-4">
        <Skeleton className="h-5 w-16" />
      </td>
      <td className="border-l border-border px-6 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="border-l border-border px-6 py-4">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="border-l border-border px-6 py-4">
        <Skeleton className="h-4 w-10" />
      </td>
      <td className="border-l border-border px-6 py-4">
        <Skeleton className="ml-auto h-4 w-16" />
      </td>
    </tr>
  )
}

export function ProjectsPage() {
  const { data: projects, error, refetch } = useProjects()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!projects) return null
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.specType.toLowerCase().includes(q) ||
        p.sdkLanguages.some((l) => l.toLowerCase().includes(q)),
    )
  }, [projects, query])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your API specs and generated artifacts.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link to="/projects/new">New project</Link>
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-6 py-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {filtered === null
              ? 'Projects'
              : `${filtered.length} ${filtered.length === 1 ? 'project' : 'projects'}`}
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, spec, or SDK…"
              className="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50"
            />
          </div>
        </div>

        {error ? (
          <EmptyState
            icon={<CircleAlert className="size-6" />}
            title="Couldn't load projects"
            description={error instanceof Error ? error.message : 'Please try again'}
            action={
              <Button size="lg" variant="outline" onClick={() => void refetch()}>
                <RefreshCw />
                Try again
              </Button>
            }
          />
        ) : filtered === null ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="border-l border-border px-6 py-3 font-medium">Spec</th>
                  <th className="border-l border-border px-6 py-3 font-medium">Status</th>
                  <th className="border-l border-border px-6 py-3 font-medium">SDKs</th>
                  <th className="border-l border-border px-6 py-3 font-medium">CLI</th>
                  <th className="border-l border-border px-6 py-3 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 5 }, (_, i) => (
                  <RowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          projects && projects.length === 0 ? (
            <EmptyState
              icon={<FolderPlus className="size-6" />}
              title="No projects yet"
              description="Connect your first API spec and we'll generate docs, SDKs, and a CLI for it."
              action={
                <Button size="lg" asChild>
                  <Link to="/projects/new">Connect a spec</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<SearchX className="size-6" />}
              title="No matches"
              description={`No projects match "${query}".`}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="border-l border-border px-6 py-3 font-medium">Spec</th>
                  <th className="border-l border-border px-6 py-3 font-medium">Status</th>
                  <th className="border-l border-border px-6 py-3 font-medium">SDKs</th>
                  <th className="border-l border-border px-6 py-3 font-medium">CLI</th>
                  <th className="border-l border-border px-6 py-3 text-right font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((project) => {
                  const status = statusMeta[project.status]
                  return (
                    <tr key={project.id} className="group transition-colors hover:bg-muted">
                      <td className="px-6 py-4">
                        <Link
                          to={`/projects/${project.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
                        >
                          {project.name}
                          <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </td>
                      <td className="border-l border-border px-6 py-4">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 font-mono text-xs font-medium uppercase',
                            specStyles[project.specType],
                          )}
                        >
                          {project.specType}
                        </span>
                      </td>
                      <td className="border-l border-border px-6 py-4">
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={cn('size-1.5 rounded-full', status.dot)} />
                          {status.label}
                        </span>
                      </td>
                      <td className="border-l border-border px-6 py-4">
                        <span className="flex flex-wrap gap-1.5">
                          {project.sdkLanguages.length ? (
                            project.sdkLanguages.map((lang) => (
                              <span
                                key={lang}
                                className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                              >
                                {lang}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground/60">—</span>
                          )}
                        </span>
                      </td>
                      <td className="border-l border-border px-6 py-4">
                        {project.cliEnabled ? (
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                            cli
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="border-l border-border px-6 py-4 text-right text-sm text-muted-foreground">
                        {relativeTime(project.updatedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
