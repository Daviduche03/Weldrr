import { CodeSquareIcon, MagicWand02Icon, PackageSent01Icon } from 'hugeicons-react'

const steps = [
  {
    title: 'Point Weldrr at your code',
    description:
      'Connect your repository — or paste an OpenAPI, GraphQL, or gRPC spec. Weldrr reads the source and maps every endpoint, schema, and auth flow.',
    icon: CodeSquareIcon,
  },
  {
    title: 'Weldrr generates everything',
    description:
      'Docs, SDKs, and a CLI are generated from your code — consistent, type-safe, and always in sync with what you actually ship.',
    icon: MagicWand02Icon,
  },
  {
    title: 'Ship and stay in sync',
    description:
      'Publish to your own git repositories and package registries. Every API change is detected and regenerated automatically.',
    icon: PackageSent01Icon,
  },
]

export function HowItWorks() {
  return (
    <section className="py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-left">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From code to shipped in three steps
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            No boilerplate. No hand-maintained docs. Weldrr reads your code and ships the complete
            developer experience.
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
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="flex flex-col bg-background p-8 transition-colors duration-300 ease-in-out hover:bg-muted"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
