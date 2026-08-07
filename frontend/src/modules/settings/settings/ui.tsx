import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Section({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted px-6 py-3">
        <div>
          <h2 className="text-[13px] font-medium text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 max-w-lg text-xs text-muted-foreground/70">{description}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          {footer}
        </div>
      )}
    </section>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground',
        className,
      )}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  )
}

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        checked ? 'bg-brand' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function SaveButton({
  saved,
  onClick,
  children,
}: {
  saved: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button size="sm" onClick={onClick}>
      {saved ? <Check /> : null}
      {saved ? 'Saved' : children}
    </Button>
  )
}
