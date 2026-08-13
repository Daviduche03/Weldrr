import { CreditCardIcon, Download01Icon } from 'hugeicons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Plan } from '@/lib/types'
import { cn } from '@/lib/utils'
import { fmt, invoices, planLimits, plans, usageRows } from '@/modules/settings/settings.data'
import { SaveButton, Section } from '@/modules/settings/settings/ui'

export function BillingSection({
  selectedPlan,
  setSelectedPlan,
  saved,
  onSave,
}: {
  selectedPlan: Plan
  setSelectedPlan: (plan: Plan) => void
  saved: boolean
  onSave: () => void
}) {
  return (
    <div className="space-y-6">
      <Section
        title="Plan"
        description={`You are currently on the ${selectedPlan} plan.`}
        footer={
          <SaveButton saved={saved} onClick={onSave}>
            Save plan
          </SaveButton>
        }
      >
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {plans.map((plan) => {
            const active = selectedPlan === plan.id
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  'relative bg-background p-6 text-left transition-colors hover:bg-muted',
                  active && 'bg-muted ring-1 ring-brand/60 ring-inset',
                )}
              >
                {active && <Badge className="absolute right-4 top-4">Current</Badge>}
                <div className="font-semibold tracking-tight">{plan.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.id !== 'enterprise' && (
                    <span className="text-sm text-muted-foreground">/mo</span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{plan.desc}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium">Usage</h3>
          <div className="mt-4 space-y-4">
            {usageRows.map((row) => {
              const limit = planLimits[selectedPlan]
              const pct = limit ? Math.min(100, (row.used / limit) * 100) : 100
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="tabular-nums">
                      <span className="font-medium">{fmt(row.used)}</span>
                      <span className="text-muted-foreground">
                        {limit ? ` of ${fmt(limit)}` : ' — unlimited'}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-[width] duration-500',
                        pct >= 100 ? 'bg-destructive' : 'bg-brand',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      <Section
        title="Payment method"
        description="The card used to pay for your subscription."
        footer={
          <Button size="sm" variant="outline">
            Update card
          </Button>
        }
      >
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
              <CreditCardIcon className="size-4" />
            </span>
            <div>
              <div className="font-mono text-sm">•••• •••• •••• 4242</div>
              <div className="text-xs text-muted-foreground">Expires 12/2028</div>
            </div>
          </div>
          <Badge variant="secondary">Visa</Badge>
        </div>
      </Section>

      <Section title="Invoices" description="Download receipts for past billing periods.">
        <ul className="divide-y divide-border">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <div className="text-sm font-medium">{invoice.period}</div>
                <div className="text-xs text-muted-foreground">{invoice.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{invoice.status}</Badge>
                <span className="text-sm font-medium tabular-nums">{invoice.amount}</span>
                <Button size="icon-sm" variant="ghost" aria-label={`Download ${invoice.period} invoice`}>
                  <Download01Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
