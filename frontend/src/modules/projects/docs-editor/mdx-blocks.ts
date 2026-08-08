// Lossless block model for the docs editor.
//
// Invariant: every block keeps its exact raw source text, and
// serializeBlocks(parseBlocks(x)) === x. Editing a block only replaces that
// block's own raw text; nothing is re-parsed or regenerated, so MDX that the
// agent pipeline also writes is never mangled on round-trip.

export type BlockType = 'heading' | 'paragraph' | 'code' | 'table' | 'list' | 'quote' | 'hr' | 'divider' | 'raw'

export type Block = {
  id: string
  type: BlockType
  /** Exact source text of this block, including trailing newline handling. */
  raw: string
  /** For headings: the heading level (1-6). */
  level?: number
  /** For code blocks: the info string (e.g. "ts"), without the backticks. */
  lang?: string
}

export function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = []
  const endsWithNL = markdown.endsWith('\n')
  const lines = markdown.split('\n')
  if (lines[lines.length - 1] === '') lines.pop() // trailing '' from final \n
  let i = 0
  let idCounter = 0

  const push = (type: BlockType, rawLines: string[], level?: number, lang?: string) => {
    const raw = rawLines.join('\n') + '\n'
    blocks.push({ id: `b${idCounter++}`, type, raw, level, lang })
  }

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim() || undefined
      const start = i
      i += 1
      while (i < lines.length && !/^```/.test(lines[i])) i += 1
      if (i < lines.length) i += 1 // include closing fence
      push('code', lines.slice(start, i), undefined, lang)
      continue
    }

    // Heading
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      push('heading', [line], heading[1].length)
      i += 1
      continue
    }

    // Thematic break
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      push('hr', [line])
      i += 1
      continue
    }

    // Blockquote
    if (/^>/.test(line)) {
      const start = i
      while (i < lines.length && /^>/.test(lines[i])) i += 1
      push('quote', lines.slice(start, i))
      continue
    }

    // Table (a line of | … | followed by a separator line of | - |)
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|,-]+\|?\s*$/.test(lines[i + 1])) {
      const start = i
      i += 2
      while (i < lines.length && /^\s*\|/.test(lines[i])) i += 1
      push('table', lines.slice(start, i))
      continue
    }

    // List (bulleted or numbered)
    if (/^(\s*)([-*+]|\d+\.)\s+/.test(line)) {
      const start = i
      i += 1
      while (
        i < lines.length &&
        (/^(\s*)([-*+]|\d+\.)\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))
      ) {
        i += 1
      }
      push('list', lines.slice(start, i))
      continue
    }

    // Blank line separator
    if (line.trim() === '') {
      push('divider', [''])
      i += 1
      continue
    }

    // Paragraph — gather contiguous non-blank, non-special lines
    const start = i
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>/.test(lines[i]) &&
      !/^\s*\|/.test(lines[i]) &&
      !/^(\s*)([-*+]|\d+\.)\s+/.test(lines[i])
    ) {
      i += 1
    }
    push('paragraph', lines.slice(start, i))
  }

  if (!endsWithNL && blocks.length > 0) {
    const last = blocks[blocks.length - 1]
    last.raw = last.raw.replace(/\n$/, '')
  }

  return blocks
}

export function serializeBlocks(blocks: Block[]): string {
  return blocks.map((b) => b.raw).join('')
}

export function emptyBlock(type: BlockType, lang?: string): Block {
  switch (type) {
    case 'heading':
      return { id: uid(), type, raw: '## New section\n', level: 2 }
    case 'code':
      return { id: uid(), type, raw: '```ts\n\n```\n', lang: lang ?? 'ts' }
    case 'table':
      return { id: uid(), type, raw: '| A | B |\n| --- | --- |\n|  |  |\n' }
    case 'quote':
      return { id: uid(), type, raw: '> Note\n' }
    case 'hr':
      return { id: uid(), type, raw: '---\n' }
    case 'list':
      return { id: uid(), type, raw: '- Item\n' }
    default:
      return { id: uid(), type: 'paragraph', raw: 'New paragraph\n' }
  }
}

function uid(): string {
  return `b${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`
}

// Inline formatting helpers — operate on the raw text of a paragraph/heading.
export function wrapInline(raw: string, marker: string): string {
  // Apply bold/italic/code to the current line selection-less: wrap whole line content
  const body = raw.replace(/\n$/, '')
  return `${marker}${body}${marker}\n`
}
