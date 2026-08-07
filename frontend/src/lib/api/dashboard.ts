import { http } from '@/lib/http'
import type { Activity, ActivityAction, DashboardData } from '@/lib/types'

type BackendActivity = {
  id: string
  projectId: string | null
  projectName: string
  action: ActivityAction
  detail: string
  createdAt: string
}

type BackendDashboard = {
  totalProjects: number
  readyProjects: number
  generatingProjects: number
  failedProjects: number
  sdksPublished: number
  docsServed: number
  usage: DashboardData['metrics']['usage']
  recentActivity: BackendActivity[]
}

function toActivity(a: BackendActivity): Activity {
  return {
    id: a.id,
    projectId: a.projectId,
    projectName: a.projectName,
    action: a.action,
    detail: a.detail,
    at: a.createdAt,
  }
}

export const dashboardApi = {
  get: async (): Promise<DashboardData> => {
    const data = await http.get<BackendDashboard>('/api/dashboard')
    return {
      metrics: {
        totalProjects: data.totalProjects,
        readyProjects: data.readyProjects,
        generatingProjects: data.generatingProjects,
        failedProjects: data.failedProjects,
        sdksPublished: data.sdksPublished,
        docsServed: data.docsServed,
        usage: data.usage,
      },
      activity: data.recentActivity.map(toActivity),
    }
  },
}