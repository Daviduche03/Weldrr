import { Fragment, useEffect, useState } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import type { ComponentType } from 'react'
import { evaluate } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'
import { useMDXComponents } from '@mdx-js/react'
import { Skeleton } from '@/components/ui/skeleton'

const PRETTY_CODE_OPTIONS = {
  theme: 'github-dark',
  keepBackground: false,
} as const

export function MdxPreview({ markdown }: { markdown: string }) {
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCompiling(true)
    setCompileError(null)

    const timer = setTimeout(async () => {
      try {
        const mdxModule = await evaluate(markdown, {
          Fragment,
          jsx,
          jsxs,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            [rehypePrettyCode, PRETTY_CODE_OPTIONS],
          ],
          useMDXComponents,
        })
        if (!cancelled) {
          setContent(() => mdxModule.default)
          setCompiling(false)
        }
      } catch (err) {
        if (!cancelled) {
          setContent(null)
          setCompileError(err instanceof Error ? err.message : 'Could not render preview')
          setCompiling(false)
        }
      }
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [markdown])

  if (compiling) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (compileError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        Could not render this page: {compileError}
      </div>
    )
  }

  if (!Content) return null

  return <Content />
}
