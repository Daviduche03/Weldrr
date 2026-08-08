import { cn } from '@/lib/utils'

export function Avatar({ name, className }: { name: string; className?: string }) {
  const seed = encodeURIComponent((name || 'guest').trim().toLowerCase())
  return (
    <span
      className={cn(
        'relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-sm font-semibold text-brand-foreground',
        className,
      )}
    >
      <img
        src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    </span>
  )
}
