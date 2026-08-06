import { logos } from '@/modules/landing/data/logos'

export function LogoStrip() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ml-auto max-w-2xl text-right">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Trusted by engineering teams shipping AI-native products
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            From seed-stage startups to public companies, teams use Weldrr to ship docs, SDKs, and
            CLIs faster.
          </p>
        </div>
      </div>

      <div
        className="mt-16"
        style={{
          marginLeft: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
          marginRight: 'max(2rem, calc((100vw - 80rem) / 2 - 2rem))',
        }}
      >
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex flex-col bg-background p-8 transition-colors duration-300 ease-in-out hover:bg-muted"
            >
              <img
                src={logo.src}
                alt={logo.name}
                title={logo.name}
                className="h-6 w-auto self-start opacity-60 grayscale transition-opacity hover:opacity-100"
              />
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{logo.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {logo.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
