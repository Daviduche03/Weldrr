import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CircleAlert,
  LoaderCircle,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { Activity, DashboardMetrics } from '@/lib/types'
import { cn } from '@/lib/utils'

const activityMeta: Record<Activity['action'], { label: string; dot: string }> = {
  generated: { label: 'Generated', dot: 'bg-emerald-500' },
  spec_updated: { label: 'Spec updated', dot: 'bg-sky-500' },
  failed: { label: 'Failed', dot: 'bg-rose-500' },
  released: { label: 'Released', dot: 'bg-brand' },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

const usageColors = ['#8d54ff', '#06b6d4', '#f59e0b', '#10b981'] as const

const statusCards = [
  {
    label: 'Ready',
    value: (m: DashboardMetrics) => m.readyProjects,
    hint: 'Docs, SDKs, and CLI are live',
    to: '/projects',
    icon: BadgeCheck,
  },
  {
    label: 'Generating',
    value: (m: DashboardMetrics) => m.generatingProjects,
    hint: 'Regenerating from latest spec',
    to: '/projects',
    icon: LoaderCircle,
  },
  {
    label: 'Needs attention',
    value: (m: DashboardMetrics) => m.failedProjects,
    hint: 'Generation failed — check the spec',
    to: '/projects',
    icon: CircleAlert,
  },
]

function UsageDonut({ usage }: { usage: DashboardMetrics['usage'] }) {
  const slices = [
    { label: 'Docs served', value: usage.docs },
    { label: 'SDK downloads', value: usage.sdks },
    { label: 'CLI installs', value: usage.cli },
    { label: 'MCP calls', value: usage.mcp },
  ]
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="12"
          />
          {slices.map((slice, i) => {
            const dash = (slice.value / total) * circumference
            const segment = (
              <circle
                key={slice.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={usageColors[i]}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            )
            offset += dash
            return segment
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-semibold tracking-tight">{formatNumber(total)}</span>
          <span className="text-[10px] text-muted-foreground">requests</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((slice, i) => (
          <li key={slice.label} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: usageColors[i] }}
            />
            <span className="truncate text-muted-foreground">{slice.label}</span>
            <span className="ml-auto font-medium tabular-nums">{formatNumber(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])

  useEffect(() => {
    let mounted = true
    Promise.all([api.getDashboardMetrics(), api.listActivity()]).then(([m, a]) => {
      if (mounted) {
        setMetrics(m)
        setActivity(a)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-6 sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what needs attention across your projects.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link to="/onboarding">
            <Plus />
            New project
          </Link>
        </Button>
      </div>

      {/* Status + metrics + usage */}
      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {statusCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              to={card.to}
              className="flex min-h-36 items-center gap-4 bg-background px-6 transition-colors duration-300 ease-in-out hover:bg-muted"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="text-2xl font-semibold tracking-tight">
                  {metrics ? card.value(metrics) : '—'}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">{card.label}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground/70">
                  {card.hint}
                </div>
              </div>
            </Link>
          )
        })}

        <div className="flex min-h-36 flex-col justify-between gap-3 bg-background p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">Usage</div>
            <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              30d
            </span>
          </div>
          {metrics ? (
            <UsageDonut usage={metrics.usage} />
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-background">
        <div
          className="flex items-center justify-between border-b border-border bg-card px-6 py-3"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        >
          <h2 className="text-sm font-medium text-muted-foreground">Recent activity</h2>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-muted"
          >
            All projects
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Project</th>
              <th className="border-l border-border px-6 py-3 font-medium">Activity</th>
              <th className="border-l border-border px-6 py-3 font-medium">Type</th>
              <th className="border-l border-border px-6 py-3 text-right font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activity.map((item) => {
              const meta = activityMeta[item.action]
              return (
                <tr key={item.id} className="transition-colors hover:bg-muted">
                  <td className="px-6 py-3.5 text-sm font-medium">{item.projectName}</td>
                  <td className="border-l border-border px-6 py-3.5 text-sm text-muted-foreground">
                    {item.detail}
                  </td>
                  <td className="border-l border-border px-6 py-3.5">
                    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn('size-1.5 rounded-full', meta.dot)} />
                      {meta.label}
                    </span>
                  </td>
                  <td className="border-l border-border px-6 py-3.5 text-right text-sm text-muted-foreground">
                    {relativeTime(item.at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
        {[
          { title: 'Connect a spec', desc: 'Generate docs, SDKs, and a CLI.', to: '/onboarding', icon: Plus },
          { title: 'View docs', desc: 'Open your published documentation.', to: '/projects', icon: BookOpen },
          { title: 'Regenerate all', desc: 'Re-run generation for every project.', to: '/projects', icon: RefreshCw },
        ].map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.title}
              to={action.to}
              className="group flex min-h-36 flex-col justify-center bg-background p-6 transition-colors duration-300 ease-in-out hover:bg-muted"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                <Icon className="size-5" />
              </span>
              <div className="mt-4 font-medium tracking-tight">{action.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{action.desc}</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
