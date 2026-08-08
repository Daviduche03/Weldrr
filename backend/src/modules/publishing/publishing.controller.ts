import type { Response } from 'express'
import { publishingService } from '@/services/publishing'
import type { WorkspaceRequest } from '@/shared/types/request'
import type { ApiResponse, ApiMessageResponse } from '@/shared/types/response'
import { z } from 'zod'

const projectIdParamSchema = z.object({ projectId: z.string().min(1) })

const mergeSchema = z.object({
  prNumber: z.number().int().positive(),
  kind: z.enum(['docs', 'sdk']),
})

export const publishingController = {
  async merge(req: WorkspaceRequest, res: Response<ApiResponse<{ merged: boolean; version?: string }>>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const { prNumber, kind } = mergeSchema.parse(req.body)
    const data = await publishingService.mergeNow(
      req.workspace.workspaceId,
      projectId,
      prNumber,
      kind,
    )
    res.json({ status: 'success', data })
  },

  async watch(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const { prNumber, kind } = mergeSchema.parse(req.body)
    // Fire-and-forget: poll the PR in the background and finalize on merge.
    void publishingService
      .watchAndFinalize(req.workspace.workspaceId, projectId, prNumber, kind)
      .catch((err: unknown) => {
        // Background watcher errors are logged by the service; nothing to surface here.
        void err
      })
    res.json({ status: 'success', message: 'Watching pull request' })
  },
}
