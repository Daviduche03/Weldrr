import { useMemo } from 'react'
import { GitBranch, MoreHorizontal, Package } from 'lucide-react'
import type { ArtifactVersion, DiscoveryEndpoint, Project, Sandbox, Sdk } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatTime } from '@/modules/projects/project-detail.page'

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

/** Single stat card: label, big value, sub-caption. */
function StatCard({ label, value, caption }: { label: string; value: React.ReactNode; caption: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{caption}</div>
    </div>
  )
}

type DayBucket = { label: string; sdk: number; docs: number }

/**
 * Daily-activity bar chart: builds per day over the last N days, split by SDK
 * (left) vs docs (right). Pure CSS bars, no chart lib.
 */
function ActivityChart({ builds }: { builds: Sandbox[] }) {
  const days: DayBucket[] = useMemo(() => {
    const out: DayBucket[] = []
    const now = new Date()
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      out.push({
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sdk: 0,
        docs: 0,
      })
    }
    for (const b of builds) {
      const t = new Date(b.createdAt)
      const diff = Math.floor((now.getTime() - t.getTime()) / 86_400_000)
      if (diff >= 0 && diff <= 29) {
        const idx = 29 - diff
        if (b.jobType === 'sdk') out[idx].sdk += 1
        else if (b.jobType === 'docs') out[idx].docs += 1
      }
    }
    return out
  }, [builds])

  const max = Math.max(1, ...days.map((d) => Math.max(d.sdk, d.docs)))

  return (
    <div>
      <div className="flex h-48 items-end gap-1">
        {days.map((d, i) => (
          <div key={i} className="group flex flex-1 flex-col items-center gap-0.5" title={`${d.label} — ${d.sdk} SDK, ${d.docs} docs builds`}>
            <div
              className="w-full rounded-sm bg-brand/80 transition-opacity group-hover:opacity-100"
              style={{ height: `${(d.sdk / max) * 100}%`, minHeight: d.sdk > 0 ? 3 : 1, opacity: d.sdk === 0 ? 0.15 : undefined }}
            />
            <div
              className="w-full rounded-sm bg-violet-400/80 dark:bg-violet-500/80 transition-opacity group-hover:opacity-100"
              style={{ height: `${(d.docs / max) * 100}%`, minHeight: d.docs > 0 ? 3 : 1, opacity: d.docs === 0 ? 0.15 : undefined }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{days[0]?.label}</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm bg-brand/80" /> SDK
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm bg-violet-400/80 dark:bg-violet-500/80" /> Docs
          </span>
        </div>
        <span>{days[days.length - 1]?.label}</span>
      </div>
    </div>
  )
}

export function ProjectOverview({
  project,
  endpoints,
  sdks,
  versions,
  builds,
}: {
  project: Project
  endpoints: DiscoveryEndpoint[]
  sdks: Sdk[]
  versions: ArtifactVersion[]
  builds: Sandbox[]
}) {
  const succeeded = builds.filter((b) => b.status === 'finished').length
  const sdkVersions = versions.filter((v) => v.artifactType === 'sdk')
  const docsVersions = versions.filter((v) => v.artifactType === 'docs')
  const currentSdkVersion = sdkVersions[0]?.version ?? project.sdkVersion
  const currentDocsVersion = docsVersions[0]?.version ?? project.docsVersion

  const stats = [
    { label: 'Endpoints', value: formatNumber(endpoints.length), caption: 'Public API endpoints discovered' },
    { label: 'SDKs generated', value: formatNumber(sdks.length), caption: 'SDK packages produced for this project' },
    { label: 'Versions published', value: formatNumber(versions.length), caption: 'SDK + docs versions recorded' },
    { label: 'Builds succeeded', value: formatNumber(succeeded), caption: `of ${formatNumber(builds.length)} total builds` },
    { label: 'SDK version', value: currentSdkVersion ? `v${currentSdkVersion}` : '—', caption: 'Latest published SDK' },
    { label: 'Docs version', value: currentDocsVersion ? `v${currentDocsVersion}` : '—', caption: 'Latest published docs' },
  ]

  const recentVersions = versions.slice(0, 8)

  return (
    <div className="min-w-0">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Daily activity */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
        <div
          className="flex items-center justify-between gap-4 border-b border-border bg-muted px-6 py-3"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        >
          <h2 className="text-sm font-medium text-foreground">Daily activity</h2>
          <span className="text-xs text-muted-foreground">Last 30 days · builds</span>
        </div>
        <div className="p-4">
          <ActivityChart builds={builds} />
        </div>
      </section>

      {/* Recent versions */}
      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-background">
        <div
          className="flex items-center justify-between gap-4 border-b border-border bg-muted px-6 py-3"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        >
          <h2 className="text-sm font-medium text-foreground">Recent versions</h2>
          <span className="text-xs text-muted-foreground">{versions.length} total</span>
        </div>
        {recentVersions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">No versions published yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentVersions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <span className="font-mono text-[13px] font-medium">v{v.version}</span>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs uppercase text-muted-foreground">
                      {v.artifactType === 'sdk' ? 'sdk' : 'doc'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatTime(v.createdAt)}</TableCell>
                  <TableCell className="w-12">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Actions for v${v.version}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          disabled={!v.artifactUrl}
                          onClick={() => v.artifactUrl && window.open(v.artifactUrl, '_blank', 'noreferrer')}
                        >
                          <GitBranch />
                          View repo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!v.artifactUrl}
                          onClick={() => v.artifactUrl && window.open(v.artifactUrl, '_blank', 'noreferrer')}
                        >
                          <Package />
                          View package
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                          Set as current version
                          <span className="ml-auto text-xs text-muted-foreground">soon</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
