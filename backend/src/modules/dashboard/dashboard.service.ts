import { dashboardRepository } from '@/modules/dashboard/dashboard.repository'
import { workspaceRepository } from '@/modules/workspace/workspace.repository'
import { activityService } from '@/modules/activity/activity.service'
import { NotFoundError } from '@/middleware/errorHandler'
import type { DashboardResponse } from '@/modules/dashboard/dashboard.types'

export const dashboardService = {
  async get(workspaceId: string): Promise<DashboardResponse> {
    const workspace = await workspaceRepository.findById(workspaceId)
    if (!workspace) throw new NotFoundError('Workspace not found')

    const counts = await dashboardRepository.countProjectsByStatus(workspaceId)
    const recent = await activityService.list(workspaceId, { page: 1, limit: 6 })

    return {
      totalProjects: counts.total,
      readyProjects: counts.ready,
      generatingProjects: counts.generating,
      failedProjects: counts.failed,
      sdksPublished: workspace.sdksPublished,
      docsServed: workspace.docsServed,
      usage: {
        docs: workspace.usageDocs,
        sdks: workspace.usageSdks,
        cli: workspace.usageCli,
        mcp: workspace.usageMcp,
      },
      recentActivity: recent.data,
    }
  },
}