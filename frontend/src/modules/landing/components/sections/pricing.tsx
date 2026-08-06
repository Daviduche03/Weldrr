import { Button } from '@/components/ui/button'

type FeatureRow = {
  label: string
  values: [string, string, string]
}

const tiers = [
  { name: 'Free', price: '$0', cta: 'Start for free' },
  { name: 'Pro', price: '$49', cta: 'Start 14-day trial', highlighted: true },
  { name: 'Enterprise', price: 'Custom', cta: 'Contact sales' },
]

const rows: FeatureRow[] = [
  { label: 'API specs', values: ['3', 'Unlimited', 'Unlimited'] },
  { label: 'Docs site', values: ['Included', 'Included', 'Included'] },
  { label: 'SDK languages', values: ['1', 'All', 'All'] },
  { label: 'CLI & webhooks', values: ['—', 'Included', 'Included'] },
  { label: 'AI chat in docs', values: ['—', 'Included', 'Included'] },
  { label: 'SSO & SAML', values: ['—', '—', 'Included'] },
  { label: 'Self-hosted', values: ['—', '—', 'Included'] },
  { label: 'Support', values: ['Community', 'Priority', 'Dedicated & SLA'] },
]

function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="size-4 text-brand"
    >
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Dash() {
  return <span className="text-muted-foreground/50">—</span>
}

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Pricing that scales with you
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Start free, upgrade when your team grows. No credit card required.
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
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="hidden grid-cols-12 gap-px bg-border md:grid">
            <div className="col-span-3 bg-background p-6" />
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`col-span-3 p-6 ${
                  tier.highlighted ? 'bg-brand-soft' : 'bg-background'
                }`}
              >
                <h3 className="font-semibold tracking-tight">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{tier.price}</span>
                  {tier.name !== 'Enterprise' && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                <Button
                  size="lg"
                  variant={tier.highlighted ? 'default' : 'outline'}
                  className="mt-4 w-full"
                  shimmer
                  asChild
                >
                  <a href="#">{tier.cta}</a>
                </Button>
              </div>
            ))}
          </div>

          <div className="hidden grid-cols-12 gap-px bg-border md:grid">
            {rows.map((row) => (
              <div key={row.label} className="contents">
                <div className="col-span-3 flex items-center bg-background px-6 py-4 text-sm font-medium">
                  {row.label}
                </div>
                {row.values.map((value, i) => (
                  <div
                    key={i}
                    className={`col-span-3 flex items-center px-6 py-4 ${
                      tiers[i].highlighted ? 'bg-brand-soft' : 'bg-background'
                    }`}
                  >
                    <span className="text-sm text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-px bg-border md:hidden">
            {tiers.map((tier) => (
              <div key={tier.name} className="bg-background p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold tracking-tight">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tracking-tight">{tier.price}</span>
                    {tier.name !== 'Enterprise' && (
                      <span className="text-xs text-muted-foreground">/month</span>
                    )}
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {rows.map((row) => (
                    <li key={row.label} className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">{row.label}</span>
                      {row.values[tiers.indexOf(tier)] === '—' ? (
                        <Dash />
                      ) : (
                        <Check />
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant={tier.highlighted ? 'default' : 'outline'}
                  className="mt-6 w-full"
                  shimmer
                  asChild
                >
                  <a href="#">{tier.cta}</a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
