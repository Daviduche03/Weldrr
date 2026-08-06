export const siteConfig = {
  name: 'Weldrr',
  tagline: 'Generate SDKs for your API. Built for the AI era.',
  description:
    'AI-assisted SDK generation, agent-friendly docs, and a CLI for your API — all from one source of truth.',
  url: 'http://localhost:5173',
  links: {
    twitter: 'https://x.com/weldrr',
    github: 'https://github.com/weldrr',
  },
} as const

export type SiteConfig = typeof siteConfig
