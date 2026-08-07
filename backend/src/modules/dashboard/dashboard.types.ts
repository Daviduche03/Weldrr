import type { ActivityResponse } from '@/modules/activity/activity.types'

export type UsageMetric = {
  docs: number
  sdks: number
  cli: number
  mcp: number
}

export type DashboardResponse = {
  totalProjects: number
  readyProjects: number
  generatingProjects: number
  failedProjects: number
  sdksPublished: number
  docsServed: number
  usage: UsageMetric
  recentActivity: ActivityResponse[]
}