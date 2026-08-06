import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Building2,
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Rocket,
  Settings,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/modules/auth/auth-provider'

const mainNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', to: '/projects', icon: Rocket },
]

const bottomNav = [{ label: 'Settings', to: '/settings', icon: Settings }]

const workspaces = [
  { id: 'acme', name: 'Acme Corp', plan: 'Pro plan' },
  { id: 'personal', name: 'Personal', plan: 'Free plan' },
]

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const [current, setCurrent] = useState(workspaces[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex cursor-pointer items-center rounded-lg border border-border bg-background text-left transition-[width,height,padding] duration-300 hover:bg-muted',
            collapsed
              ? 'size-9 justify-center gap-0 p-2'
              : 'w-full justify-start gap-2.5 p-2.5',
          )}
        >
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
            <Building2 className="size-4" />
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-full opacity-100',
            )}
          >
            <span className="block truncate text-sm font-medium">{current.name}</span>
            <span className="block text-xs text-muted-foreground">{current.plan}</span>
          </span>
          <ChevronsUpDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-[max-width,opacity] duration-300',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-4 opacity-100',
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="bottom"
        className="w-(--radix-dropdown-menu-trigger-width)"
      >
        <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspaces
        </div>
        <DropdownMenuSeparator />
        {workspaces.map((workspace) => (
          <DropdownMenuItem key={workspace.id} onClick={() => setCurrent(workspace)}>
            <span className="inline-flex size-5 items-center justify-center rounded bg-muted text-muted-foreground">
              <Building2 className="size-3" />
            </span>
            <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
            {workspace.id === current.id && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="size-4" />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const renderItems = (items: { label: string; to: string; icon: typeof LayoutDashboard }[]) =>
    items.map((item) => {
      const Icon = item.icon
      return (
        <NavLink
          key={item.to}
          to={item.to}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'flex cursor-pointer items-center rounded-lg text-sm font-medium transition-[width,height,padding] duration-300',
              collapsed
                ? 'size-9 justify-center p-2'
                : 'w-full justify-start gap-3 px-3 py-2',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          <span
            className={cn(
              'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100',
            )}
          >
            {item.label}
          </span>
        </NavLink>
      )
    })

  return (
    <nav
      className={cn(
        'flex-1 space-y-1 overflow-y-auto p-3 transition-[padding] duration-300',
        collapsed && 'flex flex-col items-center px-0',
      )}
    >
      <NavLink
        to="/onboarding"
        title={collapsed ? 'New project' : undefined}
        className={cn(
          'relative flex cursor-pointer items-center rounded-lg bg-brand text-sm font-medium text-brand-foreground transition-[width,height,padding] duration-300 hover:bg-brand/90',
          collapsed
            ? 'size-9 justify-center p-2'
            : 'w-full justify-start gap-2 px-3 py-2',
        )}
      >
        <Plus className="size-4 shrink-0" />
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-48 opacity-100',
          )}
        >
          New project
        </span>
      </NavLink>
      <div className="h-3" />
      {renderItems(mainNav)}
      <div className="pt-4" />
      <div className="h-px bg-border" />
      <div className="pt-3" />
      {renderItems(bottomNav)}
    </nav>
  )
}

export function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const currentPage =
    mainNav.find((n) => n.to === location.pathname)?.label ??
    bottomNav.find((n) => n.to === location.pathname)?.label ??
    (location.pathname.startsWith('/projects') ? 'Projects' : '')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-background">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PanelLeftClose className="size-5" />
              </button>
            </div>
            <SidebarNav collapsed={false} />
            <div className="p-3">
              <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2.5">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                  {(user?.email ?? '?').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{user?.email}</div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-background transition-[width] duration-300 lg:flex',
          collapsed ? 'w-14' : 'w-72',
        )}
      >
        <div
          className={cn(
            'flex items-center py-4 transition-[padding] duration-300',
            collapsed ? 'justify-center px-0' : 'justify-between px-5',
          )}
        >
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              title="Expand"
              className="text-muted-foreground hover:text-foreground"
            >
              <PanelLeftOpen className="size-4" />
            </Button>
          ) : (
            <>
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                title="Collapse"
                className="text-muted-foreground hover:text-foreground"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </>
          )}
        </div>

        <div className={cn('py-2 transition-[padding] duration-300', collapsed ? 'flex justify-center px-0' : 'px-3')}>
          <WorkspaceSwitcher collapsed={collapsed} />
        </div>

        <SidebarNav collapsed={collapsed} />

        <div className={cn('transition-[padding] duration-300', collapsed ? 'flex justify-center p-1' : 'p-3')}>
          <div
            className={cn(
              'flex items-center justify-start rounded-lg bg-muted/60 transition-[width,height,padding] duration-300',
              collapsed ? 'size-9 gap-0 p-2' : 'w-full gap-2.5 p-2.5',
            )}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
              {(user?.email ?? '?').charAt(0).toUpperCase()}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300',
                collapsed ? 'max-w-0 opacity-0' : 'max-w-full opacity-100',
              )}
            >
              <div className="truncate text-sm font-medium">{user?.email}</div>
              <button
                type="button"
                onClick={signOut}
                className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </span>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          collapsed ? 'lg:pl-14' : 'lg:pl-72',
        )}
      >
        <main className="mx-auto max-w-full py-3 lg:px-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <PanelLeftOpen className="size-4" />
            Menu
          </button>
          <div className="flex min-h-[calc(100vh-1.5rem)] flex-col rounded-2xl border border-border bg-card p-1">
            <div className="flex h-full flex-1 flex-col rounded-xl border border-border bg-background">
              <div
                className="flex h-12 items-center gap-2 rounded-t-xl border-b border-border bg-card px-6"
                style={{
                  backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              >
                {currentPage && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {currentPage}
                  </span>
                )}
              </div>
              <div className="flex-1 py-5 sm:py-7">
                <Outlet />
              </div>
              <div
                className="rounded-b-xl border-t border-border bg-card px-6 py-3"
                style={{
                  backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
