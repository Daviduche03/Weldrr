export function SectionDivider() {
  return (
    <div
      className="relative py-12"
      style={{
        marginLeft: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
        marginRight: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
      }}
    >
      <div className="h-px border-t border-border" />
      <CrossMark className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <CrossMark className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2" />
    </div>
  )
}

function CrossMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`size-3 text-foreground ${className ?? ''}`}
    >
      <path
        d="M8 1v14M1 8h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
