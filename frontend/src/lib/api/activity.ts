import { http } from '@/lib/http'
import type { Activity, ActivityAction } from '@/lib/types'

type BackendActivity = {
  id: string
  projectId: string | null
  projectName: string
  action: ActivityAction
  detail: string
  createdAt: string
}

export const activityApi = {
  list: async (): Promise<Activity[]> => {
    const data = await http.get<BackendActivity[]>('/api/activity', { query: { limit: 50 } })
    return data.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      projectName: a.projectName,
      action: a.action,
      detail: a.detail,
      at: a.createdAt,
    }))
  },
}