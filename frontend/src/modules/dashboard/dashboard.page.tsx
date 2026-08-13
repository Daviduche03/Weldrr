import { Link } from 'react-router-dom'
import {
  ArrowUpRight01Icon,
  CheckmarkBadge01Icon,
  BookOpen01Icon,
  Alert01Icon,
  Clock01Icon,
  Add01Icon,
  Refresh01Icon,
} from 'hugeicons-react'
import { LoaderCircle } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDashboard } from '@/lib/queries'
import type { Activity, DashboardMetrics } from '@/lib/types'
import { cn } from '@/lib/utils'

const activityMeta: Record<string, { label: string; dot: string }> = {
  generated: { label: 'Generated', dot: 'bg-emerald-500' },
  spec_updated: { label: 'Spec updated', dot: 'bg-sky-500' },
  failed: { label: 'Failed', dot: 'bg-rose-500' },
  released: { label: 'Released', dot: 'bg-brand' },
  created: { label: 'Created', dot: 'bg-emerald-500' },
  deleted: { label: 'Deleted', dot: 'bg-rose-500' },
  member_added: { label: 'Member added', dot: 'bg-sky-500' },
  member_removed: { label: 'Member removed', dot: 'bg-rose-500' },
  role_changed: { label: 'Role changed', dot: 'bg-amber-500' },
  plan_changed: { label: 'Plan changed', dot: 'bg-brand' },
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

const usageColors = ['#f97316', '#06b6d4', '#f59e0b', '#10b981'] as const

const statusCards = [
  {
    label: 'Ready',
    value: (m: DashboardMetrics) => m.readyProjects,
    hint: 'Docs, SDKs, and CLI are live',
    to: '/projects',
    icon: CheckmarkBadge01Icon,
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
    icon: Alert01Icon,
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

function StatusCardSkeleton() {
  return (
    <div className="flex min-h-36 items-center gap-4 bg-background px-6">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-6 w-10" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

function ActivityRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-56" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="ml-auto h-4 w-14" />
      </TableCell>
    </TableRow>
  )
}

export function DashboardPage() {
  const { data, isLoading: loading } = useDashboard()
  const metrics = data?.metrics ?? null
  const activity: Activity[] = data?.activity ?? []

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
          <Link to="/projects/new">
            <Add01Icon />
            New project
          </Link>
        </Button>
      </div>

      {/* Status + metrics + usage */}
      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <StatusCardSkeleton key={i} />)
          : statusCards.map((card) => {
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

        {!loading && (
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
        )}
      </div>

      {/* Recent activity */}
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border bg-muted px-6 py-3">
          <h2 className="text-[13px] font-medium text-foreground">Recent activity</h2>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-muted"
          >
            All projects
            <ArrowUpRight01Icon className="size-4" />
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 4 }, (_, i) => <ActivityRowSkeleton key={i} />)
              : activity.map((item) => {
                  const meta = activityMeta[item.action] ?? { label: item.action, dot: 'bg-muted' }
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-medium">{item.projectName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.detail}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={cn('size-1.5 rounded-full', meta.dot)} />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {relativeTime(item.at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
          </TableBody>
        </Table>
        {!loading && activity.length === 0 && (
          <EmptyState
            icon={<Clock01Icon className="size-6" />}
            title="No activity yet"
            description="Connect your first spec to get started."
            className="py-12"
          />
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border">
        {[
          { title: 'Connect a spec', desc: 'Generate docs, SDKs, and a CLI.', to: '/projects/new', icon: Plus },
          { title: 'View docs', desc: 'Open your published documentation.', to: '/projects', icon: BookOpen01Icon },
          { title: 'Regenerate all', desc: 'Re-run generation for every project.', to: '/projects', icon: Refresh01Icon },
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
