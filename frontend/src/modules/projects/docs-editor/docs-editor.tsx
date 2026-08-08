import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Save,
  Rocket,
  RefreshCw,
  ExternalLink,
  LoaderCircle,
  Check,
} from 'lucide-react'
import { docsApi, type DocsTreeNode } from '@/lib/api/docs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { BlockEditor } from '@/modules/projects/docs-editor/block-editor'
import { cn } from '@/lib/utils'

type TreeMap = Record<string, DocsTreeNode[]>

const MdxPreview = lazy(() =>
  import('@/modules/projects/docs-editor/mdx-preview').then((m) => ({ default: m.MdxPreview })),
)

function buildTree(nodes: DocsTreeNode[]): TreeMap {
  const map: TreeMap = {}
  for (const node of nodes) {
    const dir = node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/')) : ''
    map[dir] = map[dir] ?? []
    map[dir].push(node)
  }
  return map
}

export function DocsEditor({
  projectId,
  docsUrl,
  onPublished,
}: {
  projectId: string
  docsUrl: string
  onPublished?: (version: string) => void
}) {
  const [tree, setTree] = useState<DocsTreeNode[]>([])
  const [loadingTree, setLoadingTree] = useState(true)
  const [treeError, setTreeError] = useState<string | null>(null)

  const [activePath, setActivePath] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle')
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual')
  const [publishing, setPublishing] = useState(false)
  const [publishVersion, setPublishVersion] = useState<string | null>(null)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPath, setNewPath] = useState('')
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-expand the docs source folder so editable pages are visible.
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({
    '': true,
    src: true,
    'src/docs': true,
  })

  const loadTree = useCallback(async () => {
    setLoadingTree(true)
    setTreeError(null)
    try {
      const nodes = await docsApi.tree(projectId)
      setTree(nodes)
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Could not load docs repo')
    } finally {
      setLoadingTree(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadTree()
  }, [loadTree])

  const treeMap = useMemo(() => buildTree(tree), [tree])

  const loadFile = useCallback(
    async (path: string) => {
      if (dirty && activePath !== path) {
        const ok = window.confirm('You have unsaved changes. Load this file anyway?')
        if (!ok) return
      }
      setError(null)
      try {
        const file = await docsApi.readFile(projectId, path)
        setActivePath(path)
        setContent(file.content)
        setDirty(false)
        setSaveState('idle')
        setPublishVersion(null)
        const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
        setOpenDirs((d) => ({ ...d, [dir]: true }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load file')
      }
    },
    [projectId, dirty, activePath],
  )

  const persist = useCallback(async (path: string, text: string) => {
    setSaveState('saving')
    setError(null)
    try {
      await docsApi.writeFile(projectId, path, text)
      setDirty(false)
      setSaveState('saved')
      void loadTree()
    } catch (err) {
      setSaveState('error')
      setError(err instanceof Error ? err.message : 'Could not save file')
    }
  }, [projectId, loadTree])

  // Autosave: debounce 1.5s after the last edit, then persist.
  useEffect(() => {
    if (!activePath || !dirty) return
    setSaveState('dirty')
    const timer = setTimeout(() => {
      void persist(activePath, content)
    }, 1500)
    return () => clearTimeout(timer)
  }, [content, dirty, activePath, persist])

  // Clear the "Saved" indicator after a moment.
  useEffect(() => {
    if (saveState !== 'saved') return
    const timer = setTimeout(() => setSaveState('idle'), 2500)
    return () => clearTimeout(timer)
  }, [saveState])

  async function handleSaveNow() {
    if (!activePath) return
    await persist(activePath, content)
  }

  async function handleCreatePage() {
    const path = newPath.trim()
    if (!path) return
    const normalized = path.includes('.') ? path : `${path}.mdx`
    const full = normalized.startsWith('src/docs/')
      ? normalized
      : `src/docs/${normalized.replace(/^\/+/, '')}`
    setCreating(true)
    setError(null)
    try {
      await docsApi.writeFile(projectId, full, `# ${normalized.split('/').pop()?.replace(/\.mdx$/, '')}\n`)
      setShowNewPage(false)
      setNewPath('')
      await loadTree()
      await loadFile(full)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create page')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!activePath) return
    setDeleting(true)
    setError(null)
    try {
      await docsApi.deleteFile(projectId, activePath)
      setConfirmDelete(false)
      setActivePath(null)
      setContent('')
      await loadTree()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete file')
    } finally {
      setDeleting(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setError(null)
    try {
      const result = await docsApi.publish(projectId)
      setPublishVersion(result.version)
      onPublished?.(result.version)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish')
    } finally {
      setPublishing(false)
    }
  }

  function toggleDir(dir: string) {
    setOpenDirs((d) => ({ ...d, [dir]: !d[dir] }))
  }

  const editableDocs = useMemo(() => tree.filter((n) => n.type === 'blob' && n.editable), [tree])

  const renderChildren = (dir: string, depth: number): React.ReactNode => {
    const children = (treeMap[dir] ?? [])
      .slice()
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'tree' ? -1 : 1))

    return children.map((node) => {
      const isDir = node.type === 'tree'
      const childPath = node.path
      if (isDir) {
        const open = openDirs[childPath] ?? false
        return (
          <div key={childPath}>
            <button
              type="button"
              onClick={() => toggleDir(childPath)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {open ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
              {open ? <FolderOpen className="size-4 shrink-0 text-brand" /> : <Folder className="size-4 shrink-0 text-muted-foreground" />}
              <span className="truncate">{node.name}</span>
            </button>
            {open && <div>{renderChildren(childPath, depth + 1)}</div>}
          </div>
        )
      }

      const isActive = activePath === childPath
      return (
        <button
          key={childPath}
          type="button"
          onClick={() => node.editable && void loadFile(childPath)}
          disabled={!node.editable}
          className={cn(
            'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            node.editable ? 'hover:bg-accent/60 hover:text-foreground' : 'opacity-50',
            isActive ? 'bg-accent text-foreground' : 'text-muted-foreground',
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <FileText className={cn('size-4 shrink-0', isActive ? 'text-brand' : 'text-muted-foreground')} />
          <span className="truncate">{node.name}</span>
          {node.kind === 'mdx' && (
            <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground/60">mdx</span>
          )}
        </button>
      )
    })
  }

  return (
    <div className="flex h-[calc(100vh-20rem)] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-background">
      {/* Tree */}
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-64 shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pages</span>
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="ghost" aria-label="Refresh" onClick={() => void loadTree()} className="text-muted-foreground">
                <RefreshCw className={cn('size-3.5', loadingTree && 'animate-spin')} />
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="New page" onClick={() => setShowNewPage((s) => !s)}>
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          {showNewPage && (
            <div className="border-b border-border p-2.5">
              <div className="flex items-center gap-1.5">
                <Input
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreatePage()
                    if (e.key === 'Escape') setShowNewPage(false)
                  }}
                  placeholder="page-name (e.g. pricing)"
                  autoFocus
                  className="h-8 text-xs"
                />
                <Button size="icon-sm" onClick={() => void handleCreatePage()} disabled={creating || !newPath.trim()}>
                  {creating ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                </Button>
              </div>
              <p className="mt-1.5 px-0.5 text-[10px] text-muted-foreground">
                Creates <span className="font-mono">src/docs/&lt;name&gt;.mdx</span>
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {loadingTree ? (
              <div className="space-y-1 p-1">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className={cn('h-6', i === 0 || i === 3 ? 'w-3/4' : i % 2 === 0 ? 'w-2/3' : 'w-1/2')} />
                ))}
              </div>
            ) : treeError ? (
              <div className="p-3 text-sm text-destructive">{treeError}</div>
            ) : editableDocs.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No editable docs yet — generate or publish docs first.
              </div>
            ) : (
              renderChildren('', 0)
            )}
          </div>
        </aside>

        {/* Editor */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-mono text-xs text-muted-foreground">
                {activePath ?? 'Select a page to edit'}
              </span>
              {saveState === 'saved' && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" /> Saved
                </span>
              )}
              {saveState === 'saving' && (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <LoaderCircle className="size-3 animate-spin" /> Saving…
                </span>
              )}
              {saveState === 'dirty' && (
                <span className="shrink-0 text-xs text-muted-foreground">Auto-saving…</span>
              )}
              {saveState === 'error' && (
                <span className="shrink-0 text-xs text-destructive">Save failed</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!activePath || !dirty || saveState === 'saving'}
                onClick={() => void handleSaveNow()}
              >
                <Save className="size-3.5" />
                Save now
              </Button>
              <Button size="sm" disabled={!activePath || publishing} onClick={() => void handlePublish()}>
                {publishing ? <LoaderCircle className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
                {publishing ? 'Publishing…' : 'Publish'}
              </Button>
              {activePath && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete page"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {publishVersion && (
            <div className="flex items-center gap-2 border-b border-border bg-emerald-500/5 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" />
              Published v{publishVersion} — the docs site will redeploy shortly.
            </div>
          )}

          {error && (
            <div className="border-b border-border bg-destructive/5 px-4 py-2 text-xs text-destructive">{error}</div>
          )}

          {activePath && (
            <div className="flex items-center gap-1 border-b border-border px-4 py-1.5">
              <div className="ml-auto flex items-center gap-0.5 rounded-full border border-border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setEditorMode('visual')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    editorMode === 'visual'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Visual
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('markdown')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    editorMode === 'markdown'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Markdown
                </button>
              </div>
            </div>
          )}

          {activePath ? (
            editorMode === 'visual' ? (
              <BlockEditor markdown={content} onChange={(next) => { setContent(next); setDirty(true); setSaveState('dirty') }} />
            ) : (
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setDirty(true)
                  setSaveState('dirty')
                }}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none bg-muted/40 p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-[3px] focus:ring-ring/30"
                placeholder="Write your MDX here…"
              />
            )
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                Select a page from the tree to edit it, or create a new one.
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Preview</span>
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Open site <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          <div className="flex-1 overflow-y-auto bg-muted/20 p-4">
            {activePath ? (
              <Suspense
                fallback={
                  <div className="space-y-3">
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                }
              >
                <div className="docs-prose">
                  <MdxPreview markdown={content} />
                </div>
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                Rendered preview appears here.
              </div>
            )}
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this page?"
        description={`"${activePath}" will be removed from the docs repo. This cannot be undone.`}
        icon={<Trash2 className="size-4" />}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        loading={deleting}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

