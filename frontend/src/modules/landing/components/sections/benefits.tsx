import type { ReactNode } from 'react'

function DocsSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="10" y="8" width="220" height="144" rx="12" fill="#fff" stroke="#e5e7eb" />
      <rect x="10" y="8" width="220" height="32" rx="12" fill="#f3f4f6" />
      <rect x="10" y="30" width="220" height="10" fill="#f3f4f6" />
      <circle cx="28" cy="24" r="4" fill="#ff5f56" />
      <circle cx="42" cy="24" r="4" fill="#ffbd2e" />
      <circle cx="56" cy="24" r="4" fill="#27c93f" />
      <rect x="150" y="16" width="70" height="16" rx="8" fill="#e5e7eb" />
      <rect x="24" y="48" width="120" height="12" rx="6" fill="#8d54ff" fillOpacity="0.15" />
      <rect x="24" y="72" width="100" height="8" rx="4" fill="#d1d5db" />
      <rect x="24" y="88" width="110" height="8" rx="4" fill="#d1d5db" />
      <rect x="24" y="104" width="90" height="8" rx="4" fill="#d1d5db" />
      <rect x="24" y="120" width="80" height="8" rx="4" fill="#d1d5db" />
      <rect x="158" y="48" width="64" height="104" rx="8" fill="#f9fafb" stroke="#e5e7eb" />
      <rect x="168" y="60" width="44" height="10" rx="5" fill="#8d54ff" fillOpacity="0.15" />
      <rect x="168" y="80" width="34" height="6" rx="3" fill="#d1d5db" />
      <rect x="168" y="94" width="38" height="6" rx="3" fill="#d1d5db" />
      <rect x="168" y="108" width="28" height="6" rx="3" fill="#d1d5db" />
      <rect x="168" y="126" width="44" height="14" rx="7" fill="#8d54ff" />
    </svg>
  )
}

function SdksSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="10" y="8" width="220" height="144" rx="12" fill="#fff" stroke="#e5e7eb" />
      <rect x="10" y="8" width="220" height="32" rx="12" fill="#f3f4f6" />
      <rect x="10" y="30" width="220" height="10" fill="#f3f4f6" />
      <circle cx="28" cy="24" r="4" fill="#ff5f56" />
      <circle cx="42" cy="24" r="4" fill="#ffbd2e" />
      <circle cx="56" cy="24" r="4" fill="#27c93f" />
      <rect x="24" y="48" width="88" height="8" rx="4" fill="#8d54ff" />
      <rect x="128" y="48" width="88" height="8" rx="4" fill="#8d54ff" />
      <rect x="24" y="66" width="88" height="44" rx="8" fill="#f3f4f6" />
      <rect x="128" y="66" width="88" height="44" rx="8" fill="#f3f4f6" />
      <rect x="34" y="76" width="40" height="6" rx="3" fill="#9ca3af" />
      <rect x="34" y="88" width="68" height="6" rx="3" fill="#e5e7eb" />
      <rect x="34" y="100" width="54" height="6" rx="3" fill="#e5e7eb" />
      <rect x="138" y="76" width="40" height="6" rx="3" fill="#9ca3af" />
      <rect x="138" y="88" width="68" height="6" rx="3" fill="#e5e7eb" />
      <rect x="138" y="100" width="54" height="6" rx="3" fill="#e5e7eb" />
      <rect x="24" y="122" width="46" height="20" rx="10" fill="#8d54ff" fillOpacity="0.12" />
      <text x="47" y="135" textAnchor="middle" fontSize="9" fontWeight="600" fill="#8d54ff">ts</text>
      <rect x="78" y="122" width="46" height="20" rx="10" fill="#2563eb" fillOpacity="0.12" />
      <text x="101" y="135" textAnchor="middle" fontSize="9" fontWeight="600" fill="#2563eb">py</text>
      <rect x="132" y="122" width="46" height="20" rx="10" fill="#16a34a" fillOpacity="0.12" />
      <text x="155" y="135" textAnchor="middle" fontSize="9" fontWeight="600" fill="#16a34a">go</text>
      <rect x="186" y="122" width="34" height="20" rx="10" fill="#dc2626" fillOpacity="0.12" />
      <text x="203" y="135" textAnchor="middle" fontSize="9" fontWeight="600" fill="#dc2626">rb</text>
    </svg>
  )
}

function CliSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="10" y="8" width="220" height="144" rx="12" fill="#0f0f11" />
      <rect x="10" y="8" width="220" height="30" rx="12" fill="#17181d" />
      <rect x="10" y="28" width="220" height="10" fill="#17181d" />
      <circle cx="28" cy="23" r="4" fill="#ff5f56" fillOpacity="0.7" />
      <circle cx="42" cy="23" r="4" fill="#ffbd2e" fillOpacity="0.7" />
      <circle cx="56" cy="23" r="4" fill="#27c93f" fillOpacity="0.7" />
      <text x="76" y="26" fontSize="9" fill="#ffffff" fillOpacity="0.4" fontFamily="monospace">zsh</text>
      <text x="24" y="60" fontSize="10" fill="#7dd2e8" fontFamily="monospace">$ weldrr generate</text>
      <text x="24" y="82" fontSize="10" fill="#ffffff" fillOpacity="0.5" fontFamily="monospace">OpenAPI spec detected...</text>
      <text x="24" y="98" fontSize="10" fill="#ffffff" fillOpacity="0.5" fontFamily="monospace">Generating SDKs for 12 languages</text>
      <text x="24" y="114" fontSize="10" fill="#78d28c" fontFamily="monospace">typescript, python, go</text>
      <text x="24" y="130" fontSize="10" fill="#78d28c" fontFamily="monospace">docs, cli</text>
      <rect x="24" y="138" width="160" height="6" rx="3" fill="#ffffff" fillOpacity="0.25" />
    </svg>
  )
}

function AiChatSvg() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="h-full w-full" aria-hidden="true">
      <rect x="10" y="8" width="220" height="144" rx="12" fill="#fff" stroke="#e5e7eb" />
      <rect x="10" y="8" width="220" height="32" rx="12" fill="#f3f4f6" />
      <rect x="10" y="30" width="220" height="10" fill="#f3f4f6" />
      <circle cx="28" cy="24" r="4" fill="#ff5f56" />
      <circle cx="42" cy="24" r="4" fill="#ffbd2e" />
      <circle cx="56" cy="24" r="4" fill="#27c93f" />
      <rect x="24" y="48" width="150" height="22" rx="8" fill="#8d54ff" fillOpacity="0.12" />
      <rect x="32" y="54" width="96" height="6" rx="3" fill="#8d54ff" fillOpacity="0.5" />
      <rect x="180" y="52" width="42" height="14" rx="7" fill="#8d54ff" />
      <path d="M195 57l4 3 6-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="24" y="80" width="150" height="26" rx="8" fill="#8d54ff" fillOpacity="0.12" />
      <rect x="32" y="88" width="120" height="6" rx="3" fill="#8d54ff" fillOpacity="0.4" />
      <rect x="32" y="98" width="88" height="6" rx="3" fill="#8d54ff" fillOpacity="0.4" />
      <rect x="60" y="118" width="160" height="26" rx="8" fill="#f3f4f6" />
      <rect x="68" y="126" width="72" height="6" rx="3" fill="#9ca3af" />
      <rect x="68" y="136" width="52" height="6" rx="3" fill="#d1d5db" />
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
                  <div className="mx-auto aspect-[3/2] w-full max-w-md">{card.svg}</div>
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
