import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex size-8 shrink-0 items-center justify-center text-brand',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-[62%]"
        style={{ transform: 'rotate(180deg)' }}
      >
        <path
          d="M4.5 19 L8.5 5 L11.5 13 L14.5 5 L18.5 19"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="21" r="1.3" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-sans text-lg font-semibold tracking-tight text-foreground">
        Weldrr
      </span>
    </span>
  )
}
