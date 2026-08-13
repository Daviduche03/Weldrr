import type { ReactNode } from 'react'
import { InboxIcon } from 'hugeicons-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
        {icon ?? <InboxIcon className="size-6" />}
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
