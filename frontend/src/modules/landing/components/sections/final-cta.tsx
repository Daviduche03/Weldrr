import { Button } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="py-36">
      <div
        className="overflow-hidden rounded-2xl border border-border"
        style={{
          marginLeft: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
          marginRight: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        <div className="mx-auto max-w-2xl py-24 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Start building for developers and agents
          </h2>
          <p className="mt-5 text-pretty text-lg text-muted-foreground sm:text-xl">
            Ship docs, SDKs, and a CLI from your API spec — in minutes, not months.
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
