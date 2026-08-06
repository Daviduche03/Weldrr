import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusStyles: Record<Project['status'], string> = {
  ready: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  generating: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  failed: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let mounted = true
    api.listProjects().then((data) => {
      if (mounted) setProjects(data)
    })
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (!projects) return null
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.specType.toLowerCase().includes(q),
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
          <Link to="/onboarding">New project</Link>
        </Button>
      </div>

      <div className="relative mt-6 px-6 sm:px-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:left-9" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/50 sm:max-w-md"
        />
      </div>

      {filtered === null ? (
        <div className="mt-8 rounded-2xl border border-border bg-background p-12 text-center">
          <p className="text-sm text-muted-foreground">Loading projects…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-background p-12 text-center">
          {projects && projects.length === 0 ? (
            <>
              <h2 className="text-xl font-semibold tracking-tight">No projects yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Connect your first API spec and we&apos;ll generate docs, SDKs, and a CLI for it.
              </p>
              <Button size="lg" className="mt-6" asChild>
                <Link to="/onboarding">Connect a spec</Link>
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold tracking-tight">No matches</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No projects match &ldquo;{query}&rdquo;.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group flex flex-col bg-background p-6 transition-colors duration-300 ease-in-out hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold tracking-tight">{project.name}</h3>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                    statusStyles[project.status],
                  )}
                >
                  {project.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span className="rounded-md bg-muted px-2 py-0.5 uppercase">
                  {project.specType}
                </span>
                {project.cliEnabled && <span className="rounded-md bg-muted px-2 py-0.5">cli</span>}
              </div>
              <div className="mt-4 flex flex-1 flex-wrap gap-1.5">
                {project.sdkLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                  >
                    {lang}
                  </span>
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
