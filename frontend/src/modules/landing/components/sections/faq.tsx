const faqs = [
  {
    question: 'Do I need a spec to use Weldrr?',
    answer:
      'No. Connect a repository and Weldrr reads your codebase to map every endpoint, schema, and auth flow. It also works with OpenAPI, GraphQL, gRPC, and AsyncAPI specs when you have one.',
  },
  {
    question: 'Do I need to maintain docs and SDKs separately?',
    answer:
      'No. Weldrr reads your code and generates docs, SDKs, and a CLI from it. When your API changes, Weldrr detects the drift and regenerates everything so nothing falls out of sync.',
  },
  {
    question: 'Can I self-host Weldrr?',
    answer:
      'Yes. The Enterprise plan includes self-hosted deployment, SSO and SAML, SOC 2 reports, and dedicated support with SLAs.',
  },
  {
    question: 'How does the AI chat in docs work?',
    answer:
      'Ask AI answers questions grounded in your documentation. It runs against your generated docs, so answers are accurate and always up to date — no training data or fine-tuning needed.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'The Free plan is free forever for up to 3 specs and 1 SDK language. The Pro plan starts with a 14-day trial — no credit card required.',
  },
]

export function Faq() {
  return (
    <section className="py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-left">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Everything you need to know about Weldrr. Can&apos;t find an answer? Reach out.
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
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="flex flex-col bg-background p-8 transition-colors duration-300 ease-in-out hover:bg-muted"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="size-5 text-brand"
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M9.5 9a2.5 2.5 0 1 1 3.4 2.34c-.55.23-.9.7-.9 1.27V13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16.8" r="1" fill="currentColor" />
              </svg>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{faq.question}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
