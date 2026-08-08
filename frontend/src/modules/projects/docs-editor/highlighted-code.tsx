import { useEffect, useMemo, useState } from 'react'
import { getSingletonHighlighter, codeToHtml } from 'shiki'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const LANG_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  go: 'go',
  rs: 'rust',
  java: 'java',
  rb: 'ruby',
  php: 'php',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'ini',
  md: 'markdown',
  css: 'css',
  html: 'html',
  sql: 'sql',
  sh: 'shellscript',
  bash: 'bash',
  txt: 'plaintext',
}

let highlighterPromise: Promise<unknown> | null = null

function getHighlighter(): Promise<unknown> {
  if (!highlighterPromise) {
    highlighterPromise = getSingletonHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        'typescript',
        'tsx',
        'javascript',
        'python',
        'go',
        'rust',
        'java',
        'ruby',
        'php',
        'json',
        'yaml',
        'ini',
        'markdown',
        'css',
        'html',
        'sql',
        'shellscript',
        'bash',
      ],
    })
  }
  return highlighterPromise
}

export function HighlightedCode({
  code,
  lang,
  className,
}: {
  code: string
  lang: string
  className?: string
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(false)

  const shikiLang = useMemo(() => LANG_MAP[lang] ?? 'plaintext', [lang])

  useEffect(() => {
    let cancelled = false
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
    setHtml(null)

    const run = async () => {
      try {
        await getHighlighter()
        if (cancelled) return
        const out = await codeToHtml(code, {
          lang: shikiLang,
          themes: {
            dark: 'github-dark',
            light: 'github-light',
          },
          defaultColor: false,
          cssVariablePrefix: '--shiki-',
        })
        if (!cancelled) setHtml(out)
      } catch {
        // Fall back to plain text if highlighting fails (e.g. unknown lang).
        if (!cancelled) setHtml(null)
      }
    }
    void run()

    return () => {
      cancelled = true
    }
  }, [code, shikiLang])

  if (html === null) {
    return (
      <div className={cn('space-y-2 p-4', className)}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className={cn('h-4', i % 5 === 0 ? 'w-3/4' : i % 4 === 0 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    )
  }

  if (html === '') {
    return (
      <pre className={cn('min-w-max p-4 font-mono text-xs leading-relaxed text-foreground', className)}>
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div
      className={cn('min-w-max p-4 text-xs leading-relaxed', className)}
      data-shiki-theme={isDark ? 'dark' : 'light'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
