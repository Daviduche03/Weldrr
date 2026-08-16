import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ChatBubbleOvalLeftEllipsisIcon,
  CodeBracketIcon,
  EllipsisVerticalIcon,
  HashtagIcon,
  PlusIcon,
  QueueListIcon,
  TrashIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/solid'
import {
  type Block,
  type BlockType,
  parseBlocks,
  serializeBlocks,
  emptyBlock,
} from '@/modules/projects/docs-editor/mdx-blocks'
import { cn } from '@/lib/utils'

const ADD_OPTIONS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'heading', label: 'Heading', icon: <HashtagIcon className="size-3.5" /> },
  { type: 'paragraph', label: 'Paragraph', icon: <CodeBracketIcon className="size-3.5" /> },
  { type: 'code', label: 'Code block', icon: <CodeBracketIcon className="size-3.5" /> },
  { type: 'list', label: 'List', icon: <QueueListIcon className="size-3.5" /> },
  { type: 'table', label: 'Table', icon: <ViewColumnsIcon className="size-3.5" /> },
  { type: 'quote', label: 'Quote', icon: <ChatBubbleOvalLeftEllipsisIcon className="size-3.5" /> },
]

function blockStyle(type: BlockType, level?: number): string {
  switch (type) {
    case 'heading':
      return level === 1
        ? 'text-2xl font-bold tracking-tight'
        : level === 2
          ? 'text-xl font-semibold tracking-tight'
          : 'text-base font-semibold'
    case 'code':
      return 'font-mono text-xs leading-relaxed'
    case 'quote':
      return 'border-l-3 border-border pl-4 italic'
    default:
      return 'text-sm'
  }
}

export function BlockEditor({
  markdown,
  onChange,
}: {
  markdown: string
  onChange: (next: string) => void
}) {
  const blocks = useMemo(() => parseBlocks(markdown), [markdown])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addPosition, setAddPosition] = useState<number>(-1)

  function updateBlock(id: string, raw: string) {
    const next = blocks.map((b) => (b.id === id ? { ...b, raw } : b))
    onChange(serializeBlocks(next))
  }

  function insertBlock(index: number, type: BlockType) {
    const block = emptyBlock(type)
    const next = [...blocks.slice(0, index + 1), block, ...blocks.slice(index + 1)]
    onChange(serializeBlocks(next))
    setEditingId(block.id)
    setAdding(false)
    setAddPosition(-1)
  }

  function removeBlock(id: string) {
    const next = blocks.filter((b) => b.id !== id)
    onChange(serializeBlocks(next))
    setEditingId(null)
  }

  function moveBlock(fromId: string, toIndex: number) {
    const fromIndex = blocks.findIndex((b) => b.id === fromId)
    if (fromIndex < 0 || fromIndex === toIndex) return
    const next = [...blocks]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onChange(serializeBlocks(next))
  }

  return (
    <div className="docs-prose min-h-0 flex-1 overflow-y-auto px-8 py-8">
      <div className="relative">
        {blocks.map((block, i) => (
          <BlockRow
            key={block.id}
            block={block}
            index={i}
            editing={editingId === block.id}
            adding={adding && addPosition === i}
            onStartEdit={() => setEditingId(block.id)}
            onCommit={(raw) => {
              updateBlock(block.id, raw)
              setEditingId(null)
            }}
            onRemove={() => removeBlock(block.id)}
            onMove={moveBlock}
            onAddClick={() => {
              setAdding(true)
              setAddPosition(i)
            }}
            onInsert={insertBlock}
            onCloseAdd={() => setAdding(false)}
          />
        ))}
      </div>
    </div>
  )
}

function BlockRow({
  block,
  index,
  editing,
  adding,
  onStartEdit,
  onCommit,
  onRemove,
  onMove,
  onAddClick,
  onInsert,
  onCloseAdd,
}: {
  block: Block
  index: number
  editing: boolean
  adding: boolean
  onStartEdit: () => void
  onCommit: (raw: string) => void
  onRemove: () => void
  onMove: (fromId: string, toIndex: number) => void
  onAddClick: () => void
  onInsert: (index: number, type: BlockType) => void
  onCloseAdd: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null)

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', block.id)
    setDragging(true)
  }

  function handleDragEnd() {
    setDragging(false)
    setDragOver(false)
    setDropPosition(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDropPosition(e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom')
  }

  function handleDragLeave(e: React.DragEvent) {
    const to = e.relatedTarget as Node | null
    const current = e.currentTarget as Node
    if (current.contains(to)) return
    setDragOver(false)
    setDropPosition(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const fromId = e.dataTransfer.getData('text/plain')
    if (fromId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const pos = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom'
      const toIndex = pos === 'top' ? index : index + 1
      onMove(fromId, toIndex)
    }
    setDragOver(false)
    setDropPosition(null)
  }

  return (
    <div
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop indicator */}
      {dragOver && dropPosition && (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 z-40 h-0.5 rounded-full bg-brand',
            dropPosition === 'top' ? '-top-0.5' : '-bottom-0.5',
          )}
        />
      )}

      {/* Grip + delete on hover */}
      <div
        className={cn(
          'absolute -left-9 top-0 z-30 flex flex-col items-center gap-0.5 rounded-lg bg-background/95 p-0.5 shadow-sm ring-1 ring-border transition-opacity',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        <button
          type="button"
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          aria-label="Drag block"
          title="Drag to reorder"
          className="flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-accent hover:text-muted-foreground active:cursor-grabbing"
        >
          <EllipsisVerticalIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Delete block"
          title="Delete block"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <TrashIcon className="size-4" />
        </button>
      </div>

      {/* The block */}
      {editing ? (
        <BlockInput block={block} onCommit={onCommit} />
      ) : (
        <div
          onClick={onStartEdit}
          className={cn(
            'cursor-text rounded-md px-2 py-0.5 -mx-2 transition-colors',
            dragging ? 'opacity-40' : '',
            hovered ? 'bg-accent/50' : 'bg-transparent',
          )}
        >
          <BlockView block={block} />
        </div>
      )}

      {/* Add block (thin, only when hovering or adding) */}
      {!editing && (
        <div className="relative flex h-0 items-center justify-center">
          {adding ? (
            <div
              className="absolute top-0 z-20 flex items-center gap-0.5 rounded-full border border-border bg-background px-1.5 py-1 shadow-md"
              onMouseLeave={onCloseAdd}
            >
              {ADD_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => onInsert(index, opt.type)}
                  title={opt.label}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'absolute top-0 z-10 -translate-y-1/2 rounded-full bg-background transition-opacity',
                hovered ? 'opacity-100' : 'opacity-0',
              )}
            >
              <button
                type="button"
                onClick={onAddClick}
                className="flex size-5 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                aria-label="Add block"
              >
                <PlusIcon className="size-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------------------------- Block rendering ---------------------------- */

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return <HeadingView text={block.raw.replace(/^#{1,6}\s+/, '').replace(/\n$/, '')} level={block.level ?? 2} />
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
          {block.raw.replace(/^```[^\n]*\n/, '').replace(/\n```\n?$/, '')}
        </pre>
      )
    case 'table':
      return <TableBlock raw={block.raw} />
    case 'list':
      return <ListBlock raw={block.raw} />
    case 'quote':
      return (
        <p className="border-l-3 border-border pl-4 italic text-muted-foreground">
          <Inline text={block.raw.replace(/^>\s?/, '').replace(/\n$/, '')} />
        </p>
      )
    case 'hr':
      return <div className="border-t border-border" />
    case 'divider':
      return null
    default:
      return <Inline text={block.raw.replace(/\n$/, '')} />
  }
}

function HeadingView({ text, level }: { text: string; level: number }) {
  const cls =
    level === 1
      ? 'text-2xl font-bold tracking-tight'
      : level === 2
        ? 'text-xl font-semibold tracking-tight'
        : 'text-base font-semibold'
  return (
    <div className={cls}>
      <Inline text={text} />
    </div>
  )
}

function TableBlock({ raw }: { raw: string }) {
  const rows = raw
    .trim()
    .split('\n')
    .filter((l) => l.trim() !== '' && !/^\s*\|[\s:|,-]+\|?\s*$/.test(l))
    .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    .filter((r) => r.length > 0)

  if (rows.length === 0) return null
  const [header, ...body] = rows

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th
                key={i}
                className="border-b-2 border-border px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border-b border-border px-3 py-1.5 text-muted-foreground">
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ListBlock({ raw }: { raw: string }) {
  const ordered = /^\s*\d+\.\s+/.test(raw)
  const items = raw
    .split('\n')
    .map((l) => l.replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+\.\s+/, ''))
    .filter(Boolean)

  return (
    <ul className={cn('pl-5 text-sm text-muted-foreground', ordered && 'list-decimal')}>
      {items.map((item, i) => (
        <li key={i} className={cn('mb-0.5', !ordered && 'list-disc')}>
          <Inline text={item} />
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------ Inline MDX ------------------------------- */

function Inline({ text }: { text: string }) {
  const nodes = useMemo(() => renderInline(text), [text])
  return <>{nodes}</>
}

type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'link'; value: string; href: string }

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g

  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', value: text.slice(last, m.index) })
    if (m[2] !== undefined) tokens.push({ kind: 'bold', value: m[2] })
    else if (m[4] !== undefined) tokens.push({ kind: 'italic', value: m[4] })
    else if (m[6] !== undefined) tokens.push({ kind: 'code', value: m[6] })
    else if (m[8] !== undefined) tokens.push({ kind: 'link', value: m[8], href: m[9] })
    last = re.lastIndex
  }
  if (last < text.length) tokens.push({ kind: 'text', value: text.slice(last) })
  return tokens
}

function renderInline(text: string): ReactNode[] {
  const tokens = tokenizeInline(text)
  return tokens.map((t, i) => {
    switch (t.kind) {
      case 'bold':
        return <strong key={i} className="font-semibold text-foreground">{t.value}</strong>
      case 'italic':
        return <em key={i} className="italic">{t.value}</em>
      case 'code':
        return (
          <code key={i} className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
            {t.value}
          </code>
        )
      case 'link':
        return (
          <a key={i} href={t.href} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-2 hover:opacity-80">
            {t.value}
          </a>
        )
      default:
        return <span key={i}>{t.value}</span>
    }
  })
}

/* ------------------------------- Block input ----------------------------- */

function BlockInput({ block, onCommit }: { block: Block; onCommit: (raw: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(() => initialValue(block))

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  function commit() {
    onCommit(serializeInput(block, value))
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          commit()
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          commit()
        }
      }}
      spellCheck={false}
      autoFocus
      className={cn(
        'w-full resize-none rounded-lg border border-ring/60 bg-background px-3 py-1.5 text-foreground shadow-sm outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/20',
        blockStyle(block.type, block.level),
      )}
    />
  )
}

function initialValue(block: Block): string {
  switch (block.type) {
    case 'heading':
      return block.raw.replace(/^#{1,6}\s+/, '').replace(/\n$/, '')
    case 'code':
      return block.raw.replace(/^```[^\n]*\n/, '').replace(/\n```\n?$/, '')
    case 'quote':
      return block.raw.replace(/^>\s?/, '').replace(/\n$/, '')
    default:
      return block.raw.replace(/\n$/, '')
  }
}

function serializeInput(block: Block, value: string): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level ?? 2
      return `${'#'.repeat(level)} ${value}\n`
    }
    case 'code': {
      const lang = block.lang ?? ''
      return `\`\`\`${lang}\n${value}\n\`\`\`\n`
    }
    case 'quote':
      return `> ${value}\n`
    default:
      return `${value}\n`
  }
}
