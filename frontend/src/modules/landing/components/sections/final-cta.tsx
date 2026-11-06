import { Button } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="py-20 sm:py-28 lg:py-36">
      <div
        className="mx-4 overflow-hidden rounded-2xl border border-border sm:mx-6 lg:mx-[max(2rem,calc((100vw-80rem)/2-2rem))]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-24">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Stop maintaining docs. Ship from code.
          </h2>
          <p className="mt-5 text-pretty text-lg text-muted-foreground sm:text-xl">
            Docs, SDKs, and a CLI from your codebase — in minutes, not months.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" shimmer asChild>
              <a href="#">Start for free</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#">Book a demo</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
