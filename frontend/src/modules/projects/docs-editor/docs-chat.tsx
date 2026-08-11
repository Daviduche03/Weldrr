import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowUp, ExternalLink, FileText, Sparkles, Square } from 'lucide-react'
import { http } from '@/lib/http'
import { getTokens } from '@/lib/tokens'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Improve the current page',
  'Rewrite this page for beginners',
  'What sections are missing?',
  'Draft an FAQ section',
]

function messageText(m: { content?: string; parts?: { type?: string; text?: string }[] }): string {
  if (m.content) return m.content
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text ?? '')
      .join('')
  }
  return ''
}

export function DocsChat({
  projectId,
  docsUrl,
  activePath,
  content,
}: {
  projectId: string
  docsUrl: string
  activePath: string | null
  content: string
}) {
  const [input, setInput] = useState('')

  const { messages, status, error, sendMessage, stop } = useChat({
    transport: new DefaultChatTransport({
      api: `${http.url}/api/projects/${projectId}/docs/chat`,
      headers: () => {
        const tokens = getTokens()
        return tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}
      },
      body: () => ({
        file: activePath ?? undefined,
        content: activePath ? content : undefined,
      }),
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  function sendPrompt(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    void sendMessage({ text: trimmed })
    setInput('')
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendPrompt(input)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3 text-brand" />
          Docs AI
        </span>
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

      {activePath && (
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-3 py-1.5">
          <FileText className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-[10px] text-muted-foreground" title={activePath}>
            {activePath}
          </span>
          <span className="ml-auto shrink-0 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
            context
          </span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center gap-3">
            <p className="text-sm text-muted-foreground">
              Ask the assistant to help write, improve, or explain the docs you're editing.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendPrompt(s)}
                  disabled={isLoading}
                  className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:bg-accent/40 hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-sm text-brand-foreground">
                    <span className="whitespace-pre-wrap">{messageText(m)}</span>
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                    {isLoading && i === messages.length - 1 && !messageText(m) ? (
                      <LoadingDots />
                    ) : (
                      <ChatMarkdown text={messageText(m)} />
                    )}
                  </div>
                </div>
              ),
            )}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error?.message}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-border p-2.5">
        <div className="flex items-end gap-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendPrompt(input)
              }
            }}
            rows={2}
            spellCheck={false}
            placeholder="Ask about the docs…"
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg bg-muted/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-[3px] focus:ring-ring/30"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label="Stop generating"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive text-white transition-colors hover:opacity-90"
            >
              <Square className="size-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input?.trim()}
              aria-label="Send message"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 px-0.5 text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </aside>
  )
}

/* ------------------------------ Chat markdown ---------------------------- */

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((d) => (
        <span
          key={d}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${d * 120}ms` }}
        />
      ))}
    </div>
  )
}

type ChatBlock =
  | { type: 'code'; lang: string; code: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'paragraph'; text: string }

function ChatMarkdown({ text }: { text: string }) {
  const blocks = useMemo(() => renderBlocks(text), [text])
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'code':
            return (
              <pre key={i} className="overflow-x-auto rounded-lg bg-background p-2.5 font-mono text-xs leading-relaxed text-foreground">
                {block.code}
              </pre>
            )
          case 'heading':
            return (
              <p
                key={i}
                className={cn(
                  'font-semibold',
                  block.level === 1 ? 'text-base' : block.level === 2 ? 'text-sm' : 'text-sm',
                )}
              >
                <Inline text={block.text} />
              </p>
            )
          case 'list':
            return (
              <ul key={i} className={cn('pl-4', block.ordered && 'list-decimal')}>
                {block.items.map((item, j) => (
                  <li key={j} className={cn('mb-0.5', !block.ordered && 'list-disc')}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            )
          case 'quote':
            return (
              <p key={i} className="border-l-2 border-border pl-2 italic text-muted-foreground">
                <Inline text={block.text} />
              </p>
            )
          case 'table':
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {block.header.map((h, j) => (
                        <th key={j} className="border-b border-border px-2 py-1 text-left font-semibold text-foreground">
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="border-b border-border px-2 py-1 text-muted-foreground">
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          default:
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            )
        }
      })}
    </div>
  )
}

function renderBlocks(text: string): ChatBlock[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ChatBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    const fence = line.match(/^```(\w*)/)
    if (fence) {
      const lang = fence[1]
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', lang, code: buf.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      i++
      continue
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', text: buf.join('\n') })
      continue
    }

    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: string[] = []
      while (i < lines.length && (/^\s*[-*+]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const header = line.split('|').slice(1, -1).map((s) => s.trim())
      const rows: string[][] = []
      i += 2
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map((s) => s.trim()))
        i++
      }
      blocks.push({ type: 'table', header, rows })
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    const buf: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      buf.push(lines[i])
      i++
    }
    blocks.push({ type: 'paragraph', text: buf.join(' ') })
  }

  return blocks
}

/* --------------------------------- Inline -------------------------------- */

type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'link'; value: string; href: string }

function Inline({ text }: { text: string }) {
  const nodes = useMemo(() => {
    const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g
    const tokens: InlineToken[] = []
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
  }, [text])

  return (
    <>
      {nodes.map((t, i) => {
        switch (t.kind) {
          case 'bold':
            return (
              <strong key={i} className="font-semibold text-foreground">
                {t.value}
              </strong>
            )
          case 'italic':
            return <em key={i} className="italic">{t.value}</em>
          case 'code':
            return (
              <code key={i} className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[0.85em] text-foreground">
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
      })}
    </>
  )
}
