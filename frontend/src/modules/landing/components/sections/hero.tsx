import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <h1 className="text-balance text-left text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Docs, SDKs, and CLI — generated from your code, not a spec you maintain
          </h1>
          <p className="mt-6 max-w-2xl text-left text-pretty text-lg text-muted-foreground sm:text-xl">
            Weldrr reads your codebase, understands what your API actually does, and keeps your
            developer experience in sync automatically. Built for the AI era.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" shimmer asChild>
              <a href="#">Start for free</a>
            </Button>
            <Button size="lg" variant="outline" shimmer asChild>
              <a href="#">Book a demo</a>
            </Button>
          </div>
        </div>

        <div className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-border p-4">
            <img
              src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600&q=80&auto=format&fit=crop"
              alt="Artificial intelligence and machine learning concepts"
              className="aspect-video w-full rounded-xl bg-muted object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
