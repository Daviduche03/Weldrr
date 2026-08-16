import { useEffect, useMemo, useState } from 'react'
import {
  CodeBracketIcon,
  CubeIcon,
  EllipsisHorizontalIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/solid'
import type { ArtifactVersion, DiscoveryEndpoint, Project, Sandbox, Sdk } from '@/lib/types'
import { docsApi } from '@/lib/api/docs'
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

function timeAgo(date: string | null | undefined): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

/** Single stat card: label, big value, sub-caption. */
function StatCard({
  label,
  value,
  caption,
}: {
  label: string
  value: React.ReactNode
  caption: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4">
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
          <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-0.5" title={`${d.label} — ${d.sdk} SDK, ${d.docs} docs builds`}>
            <div
              className="w-full rounded-sm bg-brand/80 transition-opacity group-hover:opacity-100"
              style={{ height: `${(d.sdk / max) * 100}%`, minHeight: d.sdk > 0 ? 3 : 1, opacity: d.sdk === 0 ? 0.15 : undefined }}
            />
            <div
              className="w-full rounded-sm bg-orange-400/80 dark:bg-orange-500/80 transition-opacity group-hover:opacity-100"
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
            <span className="size-2 rounded-sm bg-orange-400/80 dark:bg-orange-500/80" /> Docs
          </span>
        </div>
        <span>{days[days.length - 1]?.label}</span>
      </div>
    </div>
  )
}

export function ProjectOverview({
  projectId,
  project,
  endpoints,
  sdks,
  versions,
  builds,
  onPublishSdk,
  onPublishDocs,
  publishingSdk = false,
  publishingDocs = false,
}: {
  projectId: string
  project: Project
  endpoints: DiscoveryEndpoint[]
  sdks: Sdk[]
  versions: ArtifactVersion[]
  builds: Sandbox[]
  onPublishSdk: () => void
  onPublishDocs: () => void
  publishingSdk?: boolean
  publishingDocs?: boolean
}) {
  // Count published MDX pages so we can judge documentation coverage.
  const [docsPages, setDocsPages] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    docsApi
      .tree(projectId)
      .then((nodes) => {
        if (cancelled) return
        setDocsPages(
          nodes.filter((n) => n.type === 'blob' && n.path.startsWith('src/docs/') && n.path.endsWith('.mdx'))
            .length,
        )
      })
      .catch(() => {
        if (!cancelled) setDocsPages(0)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  const sortedBuilds = useMemo(
    () => [...builds].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [builds],
  )
  const succeeded = builds.filter((b) => b.status === 'finished').length
  const lastBuild = sortedBuilds[0] ?? null

  const docsVersions = versions.filter((v) => v.artifactType === 'docs')
  const lastDocsAt = docsVersions[0]?.createdAt ?? null
  const specUpdatedAt = project.updatedAt
  // Docs are stale when the source spec/repo changed after the last docs build.
  const docsStale =
    !!lastDocsAt &&
    !!specUpdatedAt &&
    new Date(specUpdatedAt).getTime() > new Date(lastDocsAt).getTime() + 60_000

  const enabledLanguages = project.sdkLanguages ?? []
  const publishedLanguages = sdks.map((s) => s.language)

  const lastBuildValue = lastBuild === null ? '—' : lastBuild.status === 'finished' ? 'Passing' : lastBuild.status === 'failed' ? 'Failed' : lastBuild.status

  const cards: { label: string; value: React.ReactNode; caption: React.ReactNode }[] = [
    {
      label: 'Documentation coverage',
      value: docsPages === null ? '…' : formatNumber(docsPages),
      caption:
        docsPages === null
          ? 'Reading docs repo…'
          : endpoints.length
            ? `${formatNumber(endpoints.length)} endpoints discovered`
            : 'MDX pages published',
    },
    {
      label: 'SDK languages',
      value: enabledLanguages.length
        ? `${publishedLanguages.length} / ${enabledLanguages.length}`
        : formatNumber(publishedLanguages.length),
      caption: publishedLanguages.length ? publishedLanguages.join(', ') : 'No SDKs published',
    },
    {
      label: 'Docs freshness',
      value: lastDocsAt ? timeAgo(lastDocsAt) : '—',
      caption: docsStale
        ? 'Stale — spec updated after last build'
        : lastDocsAt
          ? 'Up to date'
          : 'No docs published yet',
    },
    {
      label: 'Build health',
      value: lastBuildValue,
      caption: builds.length ? `${formatNumber(succeeded)} / ${formatNumber(builds.length)} builds succeeded` : 'No builds yet',
    },
  ]

  const recentVersions = versions.slice(0, 8)

  return (
    <div className="min-w-0">
      {/* Team health cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
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
                  <TableCell className="py-2.5">
                    <span className="font-mono text-[13px] font-medium">v{v.version}</span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs uppercase text-muted-foreground">
                      {v.artifactType === 'sdk' ? 'sdk' : 'doc'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5 text-sm text-muted-foreground">{formatTime(v.createdAt)}</TableCell>
                  <TableCell className="w-12 py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Actions for v${v.version}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <EllipsisHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          disabled={!v.artifactUrl}
                          onClick={() => v.artifactUrl && window.open(v.artifactUrl, '_blank', 'noreferrer')}
                        >
                          <CodeBracketIcon className="size-4" />
                          View repo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!v.artifactUrl}
                          onClick={() => v.artifactUrl && window.open(v.artifactUrl, '_blank', 'noreferrer')}
                        >
                          <CubeIcon className="size-4" />
                          View package
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {v.artifactType === 'sdk' ? (
                          <DropdownMenuItem onClick={onPublishSdk} disabled={publishingSdk}>
                            <RocketLaunchIcon className="size-4" />
                            {publishingSdk ? 'Publishing…' : 'Publish SDK'}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={onPublishDocs} disabled={publishingDocs}>
                            <RocketLaunchIcon className="size-4" />
                            {publishingDocs ? 'Publishing…' : 'Publish docs'}
                          </DropdownMenuItem>
                        )}
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