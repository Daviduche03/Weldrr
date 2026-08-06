import {
  AiNetworkIcon,
  ApiIcon,
  ComputerTerminal01Icon,
  Database01Icon,
  GithubIcon,
  Link02Icon,
  SlackIcon,
} from 'hugeicons-react'

const protocols = [
  {
    name: 'OpenAPI',
    description:
      'REST APIs defined in OpenAPI 3.0 and 3.1. Weldrr reads every endpoint, schema, and auth flow and turns it into docs, SDKs, and a CLI.',
    icon: ApiIcon,
  },
  {
    name: 'GraphQL',
    description:
      'SDL-first APIs and schemas. Weldrr understands resolvers, types, and queries so your docs and clients stay perfectly typed.',
    icon: AiNetworkIcon,
  },
  {
    name: 'gRPC',
    description:
      'Protobuf services and streaming RPCs. Generate typed clients and interactive reference docs for your gRPC APIs.',
    icon: Database01Icon,
  },
]

const integrations = [
  {
    name: 'GitHub',
    description: 'Sync your specs from repositories and trigger regenerations in CI.',
    icon: GithubIcon,
  },
  {
    name: 'Slack',
    description: 'Surface AI answers and release updates where your team already works.',
    icon: SlackIcon,
  },
  {
    name: 'Webhooks',
    description: 'Regenerate docs and SDKs automatically whenever your API changes.',
    icon: Link02Icon,
  },
  {
    name: 'CLI',
    description: 'Generate, preview, and publish everything straight from your terminal.',
    icon: ComputerTerminal01Icon,
  },
]

export function Integrations() {
  return (
    <section id="products" className="scroll-mt-20 py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ml-auto max-w-2xl text-right">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Works with your protocols and tools
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Plug Weldrr into your API spec and your existing workflow — from source control to the
            terminal.
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
        <div className="grid grid-cols-12 gap-px overflow-hidden rounded-2xl border border-border bg-border">
          {protocols.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="col-span-12 flex flex-col bg-background p-8 transition-colors duration-300 ease-in-out hover:bg-muted md:col-span-4"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{item.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )
          })}

          {integrations.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="col-span-12 flex flex-col bg-background p-8 transition-colors duration-300 ease-in-out hover:bg-muted sm:col-span-6 lg:col-span-3"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{item.name}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
