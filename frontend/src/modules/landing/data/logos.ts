export type Logo = {
  name: string
  src: string
  subtitle: string
}

export const logos: Logo[] = [
  {
    name: 'Vercel',
    src: 'https://cdn.simpleicons.org/vercel',
    subtitle: 'Deploys their API docs with Weldrr in CI.',
  },
  {
    name: 'Linear',
    src: 'https://cdn.simpleicons.org/linear',
    subtitle: 'Ships typed SDKs on every release.',
  },
  {
    name: 'Stripe',
    src: 'https://cdn.simpleicons.org/stripe',
    subtitle: 'Keeps clients in sync across languages.',
  },
  {
    name: 'Notion',
    src: 'https://cdn.simpleicons.org/notion',
    subtitle: 'Answers docs questions with Ask AI.',
  },
]
