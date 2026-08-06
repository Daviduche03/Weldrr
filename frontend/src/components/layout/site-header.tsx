import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { mainNav } from '@/modules/landing/data/nav'

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center">
          <Logo />
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {mainNav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/login">Start for free</Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px]">
              <div className="mb-6">
                <Logo />
              </div>
              <nav className="flex flex-col gap-1">
                {mainNav.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-6 border-t border-border pt-4">
                <Button size="sm" className="w-full" asChild>
                  <Link to="/login">Start for free</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
