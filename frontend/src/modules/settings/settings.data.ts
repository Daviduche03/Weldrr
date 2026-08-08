import type { Member, Plan } from '@/lib/types'

export const tabs = [
  'Profile',
  'Workspace',
  'Members',
  'API keys',
  'Billing',
  'Notifications',
  'Connections',
] as const
export type SettingsTab = (typeof tabs)[number]

export const roleMeta: Record<
  Member['role'],
  { label: string; badge: 'default' | 'secondary' | 'outline' }
> = {
  owner: { label: 'Owner', badge: 'default' },
  admin: { label: 'Admin', badge: 'secondary' },
  member: { label: 'Member', badge: 'outline' },
}

export const plans: { id: Plan; name: string; price: string; desc: string }[] = [
  { id: 'free', name: 'Free', price: '$0', desc: 'Up to 2 projects, community support' },
  { id: 'pro', name: 'Pro', price: '$49', desc: 'Unlimited projects, priority support' },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'SSO, self-hosting, SLA' },
]

export const planLimits: Record<Plan, number | null> = { free: 2, pro: 50, enterprise: null }

export const usageRows = [
  { label: 'Projects', used: 3 },
  { label: 'SDK downloads', used: 128 },
  { label: 'Docs served (30d)', used: 1_200_000 },
]

export const invoices = [
  { id: 'inv_1', period: 'July 2026', date: 'Jul 1, 2026', amount: '$49.00', status: 'Paid' },
  { id: 'inv_2', period: 'June 2026', date: 'Jun 1, 2026', amount: '$49.00', status: 'Paid' },
  { id: 'inv_3', period: 'May 2026', date: 'May 1, 2026', amount: '$49.00', status: 'Paid' },
]

export const notificationOptions = [
  {
    key: 'generation' as const,
    label: 'Generation complete',
    desc: 'When SDKs, docs, or a CLI finish generating.',
  },
  {
    key: 'failures' as const,
    label: 'Spec validation failed',
    desc: 'When a spec fails to validate or generate.',
  },
  {
    key: 'releases' as const,
    label: 'New releases',
    desc: 'When a new SDK version is published.',
  },
  {
    key: 'digest' as const,
    label: 'Weekly digest',
    desc: 'A summary of usage and activity each Monday.',
  },
]

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}
