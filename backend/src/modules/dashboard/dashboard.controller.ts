import type { Response } from 'express'
import { dashboardService } from '@/modules/dashboard/dashboard.service'
import type { WorkspaceRequest } from '@/shared/types/request'
import type { ApiResponse } from '@/shared/types/response'
import type { DashboardResponse } from '@/modules/dashboard/dashboard.types'

export const dashboardController = {
  async get(req: WorkspaceRequest, res: Response<ApiResponse<DashboardResponse>>) {
    const data = await dashboardService.get(req.workspace.workspaceId)
    res.json({ status: 'success', data })
  },
}