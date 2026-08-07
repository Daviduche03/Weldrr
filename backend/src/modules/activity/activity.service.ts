import { activityRepository } from '@/modules/activity/activity.repository'
import { offsetForPage, totalPages } from '@/shared/utils/pagination'
import type {
  ActivityResponse,
  ActivityQuery,
  RecordActivityInput,
} from '@/modules/activity/activity.types'
import type { ActivityRow } from '@/db/schema'

function toResponse(row: ActivityRow): ActivityResponse {
  return {
    id: row.id,
    projectId: row.projectId,
    projectName: row.projectName,
    action: row.action,
    detail: row.detail,
    createdAt: row.createdAt,
  }
}

export const activityService = {
  async record(input: RecordActivityInput): Promise<void> {
    await activityRepository.create({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      projectName: input.projectName,
      action: input.action,
      detail: input.detail,
    })
  },

  async list(workspaceId: string, query: ActivityQuery) {
    const offset = offsetForPage(query.page, query.limit)
    const { data, total } = await activityRepository.listByWorkspace(workspaceId, {
      limit: query.limit,
      offset,
    })

    return {
      data: data.map(toResponse),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: totalPages(total, query.limit),
      },
    }
  },
}