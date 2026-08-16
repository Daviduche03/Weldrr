import type { ReactNode } from 'react'

function DocsSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full [&_*]:transition-colors" aria-hidden="true">
      <rect x="8" y="8" width="224" height="144" rx="16" fill="var(--muted)" />
      <rect x="28" y="40" width="78" height="84" rx="8" fill="var(--card)" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="40" y="54" width="14" height="4" rx="2" fill="var(--brand)" />
      <rect x="40" y="66" width="52" height="4" rx="2" fill="var(--border)" />
      <rect x="40" y="78" width="42" height="4" rx="2" fill="var(--border)" />
      <rect x="40" y="90" width="30" height="4" rx="2" fill="var(--border)" />
      <rect x="40" y="106" width="10" height="10" rx="3" fill="var(--brand)" opacity="0.2" />
      <rect x="40" y="106" width="10" height="5" rx="3" fill="var(--brand)" opacity="0.55" />
      <rect x="56" y="106" width="34" height="10" rx="5" fill="var(--muted)" />

      <path d="M112 70h20M128 62l9 8-9 8" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      <rect x="140" y="44" width="72" height="80" rx="8" fill="var(--card)" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="152" cy="54" r="3" fill="var(--brand)" />
      <circle cx="160" cy="54" r="3" fill="var(--brand)" opacity="0.5" />
      <rect x="152" y="66" width="50" height="4" rx="2" fill="var(--brand)" opacity="0.6" />
      <rect x="152" y="70" width="50" height="4" rx="2" fill="var(--brand)" opacity="0.25" />
      <rect x="152" y="80" width="46" height="4" rx="2" fill="var(--border)" />
      <rect x="152" y="90" width="40" height="4" rx="2" fill="var(--border)" />
      <rect x="176" y="102" width="26" height="12" rx="6" fill="var(--brand)" />
      <rect x="182" y="106" width="14" height="2" rx="1" fill="var(--card)" />
    </svg>
  )
}

function SdksSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="8" y="8" width="224" height="144" rx="16" fill="var(--muted)" />
      <rect x="26" y="56" width="44" height="44" rx="10" fill="var(--brand)" opacity="0.12" stroke="var(--brand)" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="48" cy="78" r="10" fill="var(--brand)" />
      <path d="M44 78l3 3 6-7" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      <path d="M74 78h26M70 78h4" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" />

      <rect x="104" y="34" width="34" height="44" rx="8" fill="var(--card)" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="112" y="42" width="18" height="6" rx="3" fill="var(--brand)" opacity="0.7" />
      <rect x="112" y="54" width="14" height="6" rx="3" fill="var(--border)" />
      <rect x="112" y="66" width="10" height="6" rx="3" fill="var(--border)" />
      <text x="121" y="96" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--brand)">ts</text>

      <rect x="160" y="46" width="34" height="44" rx="8" fill="var(--card)" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="168" y="54" width="18" height="6" rx="3" fill="var(--brand)" opacity="0.7" />
      <rect x="168" y="66" width="14" height="6" rx="3" fill="var(--border)" />
      <rect x="168" y="78" width="10" height="6" rx="3" fill="var(--border)" />
      <text x="177" y="108" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--brand)">py</text>

      <path d="M70 78h34" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M126 78h34" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  )
}

function CliSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="8" y="8" width="224" height="144" rx="16" fill="var(--muted)" />
      <path d="M22 22h26M22 22v-5" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      <text x="26" y="62" fontSize="11" fill="var(--brand)" fontFamily="'ui-monospace','SFMono-Regular',monospace" fontWeight="600">~</text>
      <text x="40" y="62" fontSize="11" fill="var(--brand)" fontFamily="'ui-monospace',monospace">$</text>
      <text x="56" y="62" fontSize="11" fill="var(--foreground)" fontFamily="'ui-monospace',monospace" fontWeight="600">weldrr generate</text>
      <rect x="190" y="50" width="8" height="12" fill="var(--foreground)" opacity="0.8" />

      <rect x="26" y="76" width="188" height="3" rx="1.5" fill="var(--foreground)" opacity="0.1" />

      <text x="26" y="100" fontSize="9.5" fill="var(--muted-foreground)" fontFamily="'ui-monospace',monospace">✓ detected 48 endpoints</text>
      <text x="26" y="118" fontSize="9.5" fill="var(--brand)" fontFamily="'ui-monospace',monospace" fontWeight="600">→ generating →</text>
      <text x="26" y="136" fontSize="9.5" fill="var(--muted-foreground)" fontFamily="'ui-monospace',monospace">  typescript · python · go</text>
    </svg>
  )
}

function AiChatSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="8" y="8" width="224" height="144" rx="16" fill="var(--muted)" />
      <rect x="26" y="30" width="188" height="70" rx="10" fill="var(--card)" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="26" y="30" width="188" height="26" rx="10" fill="var(--brand)" opacity="0.1" />
      <rect x="26" y="48" width="188" height="8" fill="var(--brand)" opacity="0.1" />
      <circle cx="40" cy="43" r="4" fill="var(--brand)" opacity="0.85" />
      <circle cx="52" cy="43" r="4" fill="var(--brand)" opacity="0.25" />
      <circle cx="64" cy="43" r="4" fill="var(--brand)" opacity="0.25" />
      <rect x="186" y="37" width="18" height="12" rx="6" fill="var(--brand)" />
      <circle cx="195" cy="43" r="2" fill="var(--card)" />

      <rect x="38" y="64" width="120" height="6" rx="3" fill="var(--border)" />
      <rect x="38" y="78" width="96" height="6" rx="3" fill="var(--border)" />
      <rect x="194" y="80" width="10" height="6" rx="3" fill="var(--brand)" opacity="0.75" />

      <rect x="56" y="108" width="158" height="24" rx="10" fill="var(--card)" stroke="var(--brand)" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="68" y="114" width="80" height="6" rx="3" fill="var(--border)" />
      <rect x="194" y="111" width="10" height="5" rx="2.5" fill="var(--brand)" />
    </svg>
  )
}

const cards: { title: string; description: string; svg: ReactNode }[] = [
  {
    title: 'Understands your code, not just a spec',
    description:
      'Point Weldrr at your repository and it maps every endpoint, schema, and auth flow from the source itself — no hand-maintained spec to keep in sync.',
    svg: <DocsSvg />,
  },
  {
    title: 'Idiomatic SDKs',
    description:
      'Type-safe client libraries generated by language experts, in TypeScript, Python, Go, and more.',
    svg: <SdksSvg />,
  },
  {
    title: 'A CLI that works with your API',
    description:
      'Interact with your API from the terminal instantly, with autocompletion generated straight from your code.',
    svg: <CliSvg />,
  },
  {
    title: 'Catches drift before it ships',
    description:
      'When your API changes, Weldrr flags what’s out of date — documented-but-unimplemented endpoints, newly mounted routes — so your docs never lie.',
    svg: <AiChatSvg />,
  },
]

export function Benefits() {
  return (
    <section className="py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-left">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your developers need, generated from your code
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Weldrr turns your codebase into the full developer experience — docs, SDKs, and CLI —
            and keeps it in sync as your API evolves.
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
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
          {cards.map((card) => (
              <div
                key={card.title}
                className="bg-background p-4 transition-colors duration-300 ease-in-out hover:bg-muted"
              >
                <div
                  className="overflow-hidden rounded-xl p-4"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, var(--border) 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                >
                  <div className="aspect-[3/2] w-full">{card.svg}</div>
                </div>
              <div className="px-2 pb-2 pt-6">
                <h3 className="text-xl font-semibold tracking-tight">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
