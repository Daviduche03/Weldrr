import type { Response } from 'express'
import { activityService } from '@/modules/activity/activity.service'
import { activityQuerySchema } from '@/modules/activity/activity.schema'
import type { WorkspaceRequest } from '@/shared/types/request'
import type { PaginatedApiResponse } from '@/shared/types/response'
import type { ActivityResponse } from '@/modules/activity/activity.types'

export const activityController = {
  async list(req: WorkspaceRequest, res: Response<PaginatedApiResponse<ActivityResponse>>) {
    const query = activityQuerySchema.parse(req.query)
    const { data, meta } = await activityService.list(req.workspace.workspaceId, query)
    res.json({ status: 'success', data, meta })
  },
}