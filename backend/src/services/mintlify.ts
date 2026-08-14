import type { RepoTreeNode } from '@/services/github'

/**
 * Adapter that recognizes a typical Mintlify documentation repo and ports it
 * into Weldrr's docs structure (a tree of `.mdx` files under `src/docs/` plus
 * `branding.json`, rendered as plain MDX).
 *
 * Mintlify layout it understands:
 *  - `mint.json` (or `docs.json`) at the repo root: `name`, `colors`, `logo`,
 *    `navigation`, `content`.
 *  - a content directory (config `content`, default `docs`) holding `.mdx`.
 *  - Mintlify-specific MDX components (Tabs, Card, Note/Warning, CodeGroup,
 *    Accordion, RequestExample, etc.) which are flattened to plain markdown.
 */

export type MintSourceFile = { path: string; content: string }

export type MintImportPlan = {
  files: MintSourceFile[]
  navigation: string[]
  branding: Record<string, unknown>
}

/** Whitelist of Mintlify block-level tags we translate; everything else is
 * treated as inline HTML and passed through. */
const CALLOUTS: Record<string, string> = {
  Note: 'Note',
  Tip: 'Tip',
  Important: 'Important',
  Warning: 'Warning',
  Danger: 'Danger',
  Success: 'Success',
  Info: 'Info',
}

/** Fetch the raw text of a single file from a GitHub repo. */
async function readRepoRaw(
  token: string,
  fullName: string,
  path: string,
  branch: string,
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${fullName}/${branch}/${encodePath(path)}`
  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Could not read ${path} from ${fullName} (HTTP ${res.status})`)
  }
  return res.text()
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

export function parseMintConfig(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** The directory under which Mintlify keeps its `.mdx` content pages. */
export function resolveContentBase(config: Record<string, unknown> | null, tree: RepoTreeNode[]): string {
  if (typeof config?.content === 'string' && config.content.trim()) {
    return config.content.replace(/^\/+|\/+$/g, '')
  }
  // Default Mintlify content dir is `docs/`; fall back to repo root.
  return tree.some((n) => n.path === 'docs' && n.type === 'tree') ? 'docs' : ''
}

/** Extract the page slugs referenced by the config `navigation`. Handles both
 * the classic mint.json array of groups/pages and the docs.json `{ tabs:
 * [{ groups: [{ pages: [...] }] }] }` object schema. */
export function extractNavigationSlugs(config: Record<string, unknown> | null): string[] {
  const nav = config?.navigation
  const slugs = new Set<string>()

  const walk = (items: unknown[]): void => {
    for (const item of items) {
      if (typeof item === 'string') {
        if (item.trim()) slugs.add(item)
        continue
      }
      if (!item || typeof item !== 'object') continue
      const entry = item as Record<string, unknown>
      if (typeof entry.page === 'string') slugs.add(entry.page)
      if (Array.isArray(entry.pages)) walk(entry.pages)
      if (typeof entry.href === 'string' && entry.href.startsWith('/')) {
        // A direct link — record as an orphan slug too (it may be an index).
        slugs.add(entry.href.slice(1))
      }
    }
  }

  if (Array.isArray(nav)) {
    walk(nav)
  } else if (nav && typeof nav === 'object') {
    // docs.json style: { tabs: [{ tab, groups: [{ group, pages }] }] }.
    const tabs = (nav as Record<string, unknown>).tabs
    if (Array.isArray(tabs)) {
      for (const tab of tabs) {
        if (!tab || typeof tab !== 'object') continue
        const groups = (tab as Record<string, unknown>).groups
        if (Array.isArray(groups)) walk(groups)
        // Some configs put pages directly under a tab.
        const pages = (tab as Record<string, unknown>).pages
        if (Array.isArray(pages)) walk(pages)
      }
    }
    const groups = (nav as Record<string, unknown>).groups
    if (Array.isArray(groups)) walk(groups)
  }
  return [...slugs]
}

/** Given a nav slug like `architecture/overview`, return the source file path
 * under the content base (e.g. `docs/architecture/overview.mdx`). */
export function sourcePathForSlug(slug: string, contentBase: string, tree: RepoTreeNode[]): string {
  const candidates = [
    `${contentBase ? `${contentBase}/` : ''}${slug}.mdx`,
    `${contentBase ? `${contentBase}/` : ''}${slug}.md`,
    `${slug}.mdx`,
    `${slug}.md`,
  ]
  for (const c of candidates) {
    if (tree.some((n) => n.path === c)) return c
  }
  return `${contentBase ? `${contentBase}/` : ''}${slug}.mdx`
}

/** Extract frontmatter from an `.mdx` file. Returns the body without the
 * frontmatter block plus the parsed metadata. */
function stripFrontmatter(raw: string): { body: string; meta: Record<string, unknown> } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { body: raw, meta: {} }

  const meta: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const kv = /^([A-Za-z0-9_]+)\s*:\s*(.*)$/.exec(line.trim())
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim()
  }
  return { body: raw.slice(match[0].length), meta }
}

/**
 * Flatten Mintlify-specific MDX into plain markdown Weldrr's renderer can
 * handle. Keeps standard markdown, inline code, links, and plain HTML; strips
 * API-reference-only components; converts callouts, tabs, cards, code groups
 * and accordions into markdown equivalents.
 */
export function flattenMdx(raw: string): string {
  const { body, meta } = stripFrontmatter(raw)

  let out = body

  // Preserve a leading title from frontmatter `title` if the body has no H1.
  const hasH1 = /^#\s+/m.test(out)
  const title = typeof meta.title === 'string' ? meta.title.trim() : ''
  if (title && !hasH1) {
    out = `# ${title}\n\n${out}`
  }

  // Callouts: <Note>…</Note> → blockquote.
  for (const [tag, label] of Object.entries(CALLOUTS)) {
    const re = new RegExp(
      `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
      'g',
    )
    out = out.replace(re, (_m, inner: string) => {
      const text = unwrap(inner).trim()
      return text ? `> **${label}:** ${text}\n\n` : ''
    })
  }

  // Tabs: <Tabs><Tab label="…">…</Tab></Tabs> → separate ## sections.
  out = out.replace(/<Tabs[\s\S]*?<\/Tabs>/g, (block) => {
    const tabs: string[] = []
    const re = /<Tab[^>]*label="([^"]*)"[^>]*>([\s\S]*?)<\/Tab>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block)) !== null) {
      const content = unwrap(m[2]).trim()
      tabs.push(content ? `### ${m[1] || 'Tab'}\n\n${content}` : '')
    }
    return tabs.join('\n\n')
  })

  // Card groups / cards → bullet list of links.
  out = out.replace(/<CardGroup[\s\S]*?<\/CardGroup>/g, (block) => {
    const cards: string[] = []
    const re = /<Card\b([^>]*)>([\s\S]*?)<\/Card>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block)) !== null) {
      const attrs = extractAttrs(m[1])
      const title = attrs.title ?? ''
      const href = attrs.href ?? ''
      const desc = unwrap(m[2]).trim()
      const text = desc ? `${title} — ${desc}` : title
      cards.push(href ? `- [${text}](${href})` : `- ${text}`)
    }
    return cards.length ? `\n${cards.join('\n')}\n` : ''
  })
  // Standalone cards (outside CardGroup).
  out = out.replace(/<Card\b([^>]*)>([\s\S]*?)<\/Card>/g, (_m, attrsStr, inner) => {
    const attrs = extractAttrs(attrsStr)
    const title = attrs.title ?? ''
    const href = attrs.href ?? ''
    const desc = unwrap(inner).trim()
    const text = desc ? `${title} — ${desc}` : title
    return href ? `- [${text}](${href})` : `- ${text}`
  })

  // Code groups: <CodeGroup><CodeGroupItem title="…">code</CodeGroupItem></CodeGroup>.
  out = out.replace(/<CodeGroup[\s\S]*?<\/CodeGroup>/g, (block) => {
    const parts: string[] = []
    const re = /<CodeGroupItem[^>]*>([\s\S]*?)<\/CodeGroupItem>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block)) !== null) {
      parts.push(unwrap(m[1]).trim())
    }
    return parts.join('\n')
  })

  // Accordions → <details> blocks.
  out = out.replace(/<AccordionGroup[\s\S]*?<\/AccordionGroup>/g, (block) => {
    const parts: string[] = []
    const re = /<Accordion\b([^>]*)>([\s\S]*?)<\/Accordion>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block)) !== null) {
      const title = extractAttrs(m[1]).title ?? ''
      parts.push(`<details>\n<summary>${title}</summary>\n\n${unwrap(m[2]).trim()}\n\n</details>`)
    }
    return parts.join('\n')
  })

  // API reference components — not representable in plain markdown, drop them
  // but keep any text inside.
  out = out.replace(/<(RequestExample|ResponseExample|Param|ResponseField|APIAuth|SnippetGroup|Snippet)[^>]*>[\s\S]*?<\/\1>/g, (m) => {
    return unwrap(m).trim()
  })
  // Self-closing API components: drop.
  out = out.replace(/<(Param|ResponseField|RequestExample|ResponseExample|APIAuth|Snippet|SnippetGroup)\b[^>]*\/>/g, '')

  // Frames (screenshots) → image markdown.
  out = out.replace(/<Frame\b([^>]*)>([\s\S]*?)<\/Frame>/g, (_m, attrsStr) => {
    const attrs = extractAttrs(attrsStr)
    return attrs.src ? `![${attrs.alt ?? ''}](${attrs.src})` : ''
  })

  // Inline MDX images → markdown images.
  out = out.replace(/<img\b([^>]*)\/?>/g, (_m, attrsStr) => {
    const attrs = extractAttrs(attrsStr)
    return attrs.src ? `![${attrs.alt ?? ''}](${attrs.src})` : ''
  })

  // Structural wrappers: drop divs and generic containers, keep children.
  out = out.replace(/<\/?(?:div|span|section|Fragment)\b[^>]*>/g, '')

  // Tidy: collapse 3+ blank lines, trim.
  out = out.replace(/\n{3,}/g, '\n\n').trim()
  return `${out}\n`
}

/** Extract attributes from an opening tag. */
function extractAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const re = /([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  let m: RegExpExecArray | null
  while ((m = re.exec(tag)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? ''
  }
  return attrs
}

/** Strip one level of surrounding <p> tags that Mintlify wraps children in. */
function unwrap(s: string): string {
  return s.replace(/^<p>\s?/, '').replace(/\s?<\/p>$/, '')
}

/** Map Mintlify config branding → Weldrr branding.json config. */
export function toBranding(config: Record<string, unknown> | null): Record<string, unknown> {
  const colors = (config?.colors as Record<string, unknown> | undefined) ?? {}
  const out: Record<string, unknown> = {
    siteName: typeof config?.name === 'string' && config.name.trim() ? config.name : 'Docs',
  }

  // Mintlify colors: `primary` is the brand color; `light`/`dark` are the
  // primary color per theme. Pick a real accent rather than the white light-mode
  // value that some configs ship with.
  const primary = typeof colors.primary === 'string' ? colors.primary : undefined
  const light = typeof colors.light === 'string' ? colors.light : undefined
  const dark = typeof colors.dark === 'string' ? colors.dark : undefined
  const isWhiteish = (hex?: string): boolean => {
    if (!hex) return true
    const m = /^#?([0-9a-f]{6})$/i.exec(hex)
    if (!m) return true
    const n = parseInt(m[1], 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    return (r * 299 + g * 587 + b * 114) / 1000 > 235
  }
  const accent = !isWhiteish(light) ? light : !isWhiteish(dark) ? dark : undefined
  if (primary || accent) {
    out.colors = {
      ...(primary ? { primary } : {}),
      ...(accent ? { accent } : {}),
    }
  }

  // Mintlify `logo` may be a path or a `{ light, dark }` pair; `favicon` is
  // usually a single path.
  const rawLogo = config?.logo
  const logo =
    typeof rawLogo === 'string'
      ? rawLogo
      : rawLogo && typeof rawLogo === 'object'
        ? (rawLogo as Record<string, unknown>).light
        : undefined
  if (typeof logo === 'string' && logo.trim()) out.logo = logo
  if (typeof config?.favicon === 'string' && config.favicon.trim()) out.favicon = config.favicon
  return out
}

/** Build the full import plan for a Mintlify repo. */
export async function planMintlifyImport(input: {
  token: string
  fullName: string
  branch: string
  tree: RepoTreeNode[]
  readFile: (path: string) => Promise<string | null>
}): Promise<MintImportPlan> {
  const { token, fullName, branch, tree, readFile } = input

  // Find the config file at the repo root — Mintlify uses `mint.json`, but
  // older setups ship `docs.json` instead.
  const configPath =
    ['mint.json', 'docs.json'].find((p) => tree.some((n) => n.path === p)) ?? 'mint.json'
  const rawConfig = await readRepoRaw(token, fullName, configPath, branch)
  const config = rawConfig ? parseMintConfig(rawConfig) : null

  const contentBase = resolveContentBase(config, tree)

  // Determine which pages to port.
  const navSlugs = extractNavigationSlugs(config)
  let slugs = navSlugs
  if (slugs.length === 0) {
    // Fall back to every mdx under the content base.
    slugs = tree
      .filter((n) => n.type === 'blob' && /\.(mdx|md)$/.test(n.path))
      .filter((n) => !contentBase || n.path.startsWith(`${contentBase}/`))
      .map((n) => {
        const rel = contentBase ? n.path.slice(contentBase.length + 1) : n.path
        return rel.replace(/\.(mdx|md)$/, '')
      })
  }

  const files: MintSourceFile[] = []
  const seen = new Set<string>()
  for (const slug of slugs) {
    const clean = slug.replace(/^\/+/, '')
    if (!clean || seen.has(clean)) continue
    seen.add(clean)

    const src = sourcePathForSlug(clean, contentBase, tree)
    const raw = await readFile(src)
    if (raw === null) continue
    // Nav slugs may already include the content base prefix (docs.json), so
    // normalize to a path relative to the content base for src/docs/.
    const rel = contentBase && clean.startsWith(`${contentBase}/`) ? clean.slice(contentBase.length + 1) : clean
    files.push({ path: `src/docs/${rel}.mdx`, content: flattenMdx(raw) })
  }

  return {
    files,
    navigation: [...seen],
    branding: toBranding(config),
  }
}
