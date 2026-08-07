import type { ReactNode } from 'react'
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ConfirmDialogTone = 'danger' | 'warning' | 'default'

const toneStyles: Record<
  ConfirmDialogTone,
  { badge: string; confirm: string }
> = {
  danger: {
    badge:
      'border-destructive/30 bg-destructive/10 text-destructive dark:text-destructive',
    confirm: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    badge:
      'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    confirm: 'bg-brand text-brand-foreground hover:bg-brand/90',
  },
  default: {
    badge: 'border-border bg-muted text-foreground',
    confirm: '',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  tone = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon: ReactNode
  tone?: ConfirmDialogTone
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
}) {
  const styles = toneStyles[tone]

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background p-8 text-center shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'inline-flex size-14 shrink-0 items-center justify-center rounded-full border [&_svg]:size-6',
                styles.badge,
              )}
            >
              {icon}
            </span>

            <AlertDialogPrimitive.Title className="mt-4 text-lg font-semibold tracking-tight">
              {title}
            </AlertDialogPrimitive.Title>

            {description && (
              <AlertDialogPrimitive.Description className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {description}
              </AlertDialogPrimitive.Description>
            )}

            <div className="mt-7 grid w-full grid-cols-2 gap-2.5">
              <AlertDialogPrimitive.Cancel asChild>
                <Button variant="outline" disabled={loading}>
                  {cancelLabel}
                </Button>
              </AlertDialogPrimitive.Cancel>
              <Button
                className={cn(styles.confirm)}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading && <LoaderCircle className="size-4 animate-spin" />}
                {confirmLabel}
              </Button>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}