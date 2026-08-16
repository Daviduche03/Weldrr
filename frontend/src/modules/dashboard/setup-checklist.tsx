import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowPathIcon,
  CheckIcon,
  CodeBracketIcon,
  PlusIcon,
  ShareIcon,
} from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { githubApi } from '@/lib/api/github'
import { projectApi } from '@/lib/api/projects'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SetupChecklist() {
  const [searchParams] = useSearchParams()
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null)
  const [projects, setProjects] = useState<Project[] | null>(null)

  const connectGithub = async () => {
    try {
      const { url } = await githubApi.authUrl()
      window.location.href = url
    } catch {
      // noop
    }
  }

  useEffect(() => {
    void githubApi
      .status()
      .then((s) => setGithubConnected(s.connected))
      .catch(() => setGithubConnected(false))
    void projectApi
      .list()
      .then(setProjects)
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    if (searchParams.get('github') === 'connected') {
      void githubApi
        .status()
        .then((s) => setGithubConnected(s.connected))
        .catch(() => undefined)
    }
  }, [searchParams])

  if (projects === null || githubConnected === null) return null

  const firstProject = projects[0]
  const readyProject = projects.find((p) => p.status === 'ready')
  const publishedProject = projects.find((p) => p.docsUrl)

  const steps: {
    key: string
    title: string
    desc: string
    icon: ComponentType<{ className?: string }>
    done: boolean
    cta: ReactNode
  }[] = [
    {
      key: 'project',
      title: 'Create your first project',
      desc: 'Connect a spec to generate from.',
      icon: PlusIcon,
      done: projects.length > 0,
      cta: (
        <Button asChild size="sm">
          <Link to="/projects/new">Create project</Link>
        </Button>
      ),
    },
    {
      key: 'github',
      title: 'Connect GitHub',
      desc: 'Auto-generate docs and SDKs on every push.',
      icon: CodeBracketIcon,
      done: githubConnected,
      cta: (
        <Button size="sm" onClick={connectGithub}>
          Connect GitHub
        </Button>
      ),
    },
    {
      key: 'generate',
      title: 'Generate docs & SDKs',
      desc: 'Build your hosted docs site and typed clients.',
      icon: ArrowPathIcon,
      done: Boolean(readyProject),
      cta: firstProject ? (
        <Button asChild size="sm">
          <Link to={`/projects/${firstProject.id}`}>Generate</Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <Link to="/projects/new">Add a spec</Link>
        </Button>
      ),
    },
    {
      key: 'publish',
      title: 'Publish & share',
      desc: 'Ship a live docs URL your team can use.',
      icon: ShareIcon,
      done: Boolean(publishedProject),
      cta: publishedProject ? (
        <Button asChild size="sm" variant="outline">
          <a href={publishedProject.docsUrl} target="_blank" rel="noreferrer">
            View live docs
          </a>
        </Button>
      ) : firstProject ? (
        <Button asChild size="sm" variant="outline">
          <Link to={`/projects/${firstProject.id}`}>Publish docs</Link>
        </Button>
      ) : (
        <Button asChild size="sm" variant="outline">
          <Link to="/projects/new">Create a project</Link>
        </Button>
      ),
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted px-6 py-3">
        <h2 className="text-[13px] font-medium text-foreground">Set up your workspace</h2>
        <span className="font-mono text-xs text-muted-foreground">
          {doneCount}/{steps.length} done
        </span>
      </div>
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="divide-y divide-border">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-4 px-6 py-4',
                !step.done && 'bg-muted/30',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-9 shrink-0 items-center justify-center rounded-full',
                  step.done
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-background text-muted-foreground ring-1 ring-border',
                )}
              >
                {step.done ? <CheckIcon className="size-4" /> : <Icon className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cn('text-sm font-medium', step.done && 'text-muted-foreground')}>
                  {step.title}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{step.desc}</div>
              </div>
              {step.done ? (
                <span className="shrink-0 text-xs font-medium text-emerald-500">Done</span>
              ) : (
                <div className="shrink-0">{step.cta}</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}