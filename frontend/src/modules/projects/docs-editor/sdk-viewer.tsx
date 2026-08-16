import { useEffect, useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/solid'
import { useSdkTree, useSdkFile } from '@/lib/queries'
import type { SdkLanguage } from '@/lib/types'
import type { SdkTreeNode } from '@/lib/api/sdks'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HighlightedCode } from '@/modules/projects/docs-editor/highlighted-code'
import { cn } from '@/lib/utils'

type TreeMap = Record<string, SdkTreeNode[]>

function buildTree(nodes: SdkTreeNode[]): TreeMap {
  const map: TreeMap = {}
  for (const node of nodes) {
    const dir = node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/')) : ''
    map[dir] = map[dir] ?? []
    map[dir].push(node)
  }
  return map
}

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.cache'])
const IGNORED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'npm-shrinkwrap.json',
  'bun.lockb',
])

function kindBadge(kind: string): string {
  const map: Record<string, string> = {
    ts: 'TS',
    tsx: 'TSX',
    js: 'JS',
    py: 'PY',
    go: 'GO',
    rs: 'RS',
    json: 'JSON',
    md: 'MD',
    yaml: 'YML',
    toml: 'TOML',
    java: 'JAVA',
    rb: 'RB',
    php: 'PHP',
  }
  return map[kind] ?? ''
}

export function SdkViewer({
  projectId,
  language,
  onBack,
  repoUrl,
}: {
  projectId: string
  language: SdkLanguage
  onBack: () => void
  repoUrl?: string | null
}) {
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({ '': true })
  const [activePath, setActivePath] = useState<string | null>(null)
  const [fileKind, setFileKind] = useState('txt')

  const treeQuery = useSdkTree(projectId, language)
  const fileQuery = useSdkFile(projectId, language, activePath)

  const rawTree = treeQuery.data ?? []
  const tree = useMemo(
    () =>
      rawTree.filter((n) => {
        const parts = n.path.split('/')
        const inIgnoredDir = parts.slice(0, -1).some((p) => IGNORED_DIRS.has(p))
        if (inIgnoredDir) return false
        if (n.type === 'blob' && IGNORED_FILES.has(n.name)) return false
        return true
      }),
    [rawTree],
  )
  const loadingTree = treeQuery.isLoading
  const treeError = treeQuery.error instanceof Error ? treeQuery.error.message : null

  useEffect(() => {
    if (fileQuery.data) {
      setFileKind(fileQuery.data.kind)
    }
  }, [fileQuery.data])

  const treeMap = useMemo(() => buildTree(tree), [tree])

  const renderChildren = (dir: string, depth: number): React.ReactNode => {
    const children = (treeMap[dir] ?? [])
      .slice()
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'tree' ? -1 : 1))

    return children.map((node) => {
      const childPath = node.path
      if (node.type === 'tree') {
        const open = openDirs[childPath] ?? false
        return (
          <div key={childPath}>
            <button
              type="button"
              onClick={() => setOpenDirs((d) => ({ ...d, [childPath]: !d[childPath] }))}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {open ? <ChevronDownIcon className="size-3.5 shrink-0" /> : <ChevronRightIcon className="size-3.5 shrink-0" />}
              {open ? <FolderOpenIcon className="size-4 shrink-0 text-brand" /> : <FolderIcon className="size-4 shrink-0 text-muted-foreground" />}
              <span className="truncate">{node.name}</span>
            </button>
            {open && <div>{renderChildren(childPath, depth + 1)}</div>}
          </div>
        )
      }

      const isActive = activePath === childPath
      const badge = kindBadge(node.kind)
      return (
        <button
          key={childPath}
          type="button"
          onClick={() => {
            setActivePath(childPath)
            const dir = childPath.includes('/') ? childPath.slice(0, childPath.lastIndexOf('/')) : ''
            setOpenDirs((d) => ({ ...d, [dir]: true }))
          }}
          className={cn(
            'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60 hover:text-foreground',
            isActive ? 'bg-accent text-foreground' : 'text-muted-foreground',
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <CodeBracketSquareIcon className={cn('size-4 shrink-0', isActive ? 'text-brand' : 'text-muted-foreground')} />
          <span className="truncate">{node.name}</span>
          {badge && (
            <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground/60">{badge}</span>
          )}
        </button>
      )
    })
  }

  return (
    <div className="flex h-[calc(100vh-20rem)] min-h-[28rem] overflow-hidden rounded-xl border border-border bg-background">
      {/* Tree */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {language} · source
          </span>
          <Button size="icon-sm" variant="ghost" aria-label="Refresh" onClick={() => void treeQuery.refetch()} className="text-muted-foreground">
            <ArrowPathIcon className={cn('size-3.5', loadingTree && 'animate-spin')} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loadingTree ? (
            <div className="space-y-1 p-1">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={cn('h-6', i % 3 === 0 ? 'w-4/5' : i % 3 === 1 ? 'w-3/5' : 'w-2/3')} />
              ))}
            </div>
          ) : treeError ? (
            <div className="p-3 text-sm text-destructive">{treeError}</div>
          ) : tree.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              This SDK repo is empty — the build may still be in progress or failed.
            </div>
          ) : (
            renderChildren('', 0)
          )}
        </div>
      </aside>

      {/* Code viewer */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-mono text-xs text-muted-foreground">
              {activePath ?? 'Select a file to view'}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Open repo <ArrowTopRightOnSquareIcon className="size-3" />
              </a>
            )}
            <Button size="sm" variant="outline" onClick={onBack}>
              <CodeBracketIcon className="size-3.5" />
              Back to SDKs
            </Button>
          </div>
        </div>

        {fileQuery.isError && (
          <div className="border-b border-border bg-destructive/5 px-4 py-2 text-xs text-destructive">
            {fileQuery.error instanceof Error ? fileQuery.error.message : 'Could not load file'}
          </div>
        )}

        {activePath ? (
          <div className="min-h-0 flex-1 overflow-auto">
            {fileQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className={cn('h-4', i % 5 === 0 ? 'w-3/4' : i % 4 === 0 ? 'w-2/3' : 'w-full')} />
                ))}
              </div>
            ) : (
              <HighlightedCode code={fileQuery.data?.content ?? ''} lang={fileKind} />
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            <div>
              <CodeBracketSquareIcon className="mx-auto mb-3 size-8 text-muted-foreground/50" />
              Select a file from the tree to view its source.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
