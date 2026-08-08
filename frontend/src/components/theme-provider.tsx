import { useEffect, type ReactNode } from 'react'
import { useThemeStore } from '@/lib/stores/theme-store'

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: ReactNode
  defaultTheme?: 'light' | 'dark' | 'system'
}) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    if (theme === defaultTheme && !localStorage.getItem('theme')) return
    // Ensure the initial stored/default theme is applied on mount.
    useThemeStore.getState().setTheme(localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null || defaultTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the DOM in sync whenever the store theme changes.
  useEffect(() => {
    const root = document.documentElement
    const resolved = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
  }, [theme])

  return <>{children}</>
}

export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const toggle = useThemeStore((s) => s.toggle)
  return { theme, setTheme, toggle }
}
