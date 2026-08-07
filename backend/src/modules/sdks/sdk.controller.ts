import type { Response } from 'express'
import { sdkService } from '@/modules/sdks/sdk.service'
import { createSdkSchema, updateSdkSchema } from '@/modules/sdks/sdk.schema'
import type { WorkspaceRequest } from '@/shared/types/request'
import type { ApiMessageResponse, ApiResponse } from '@/shared/types/response'
import type { SdkResponse } from '@/modules/sdks/sdk.types'
import { z } from 'zod'

const idParamSchema = z.string().uuid('Invalid sdk id')

function parseProjectId(req: WorkspaceRequest): string {
  return req.params.projectId as string
}

export const sdkController = {
  async list(req: WorkspaceRequest, res: Response<ApiResponse<SdkResponse[]>>) {
    const data = await sdkService.list(req.workspace.workspaceId, parseProjectId(req))
    res.json({ status: 'success', data })
  },

  async create(req: WorkspaceRequest, res: Response<ApiResponse<SdkResponse>>) {
    const input = createSdkSchema.parse(req.body)
    const data = await sdkService.create(req.workspace.workspaceId, parseProjectId(req), input)
    res.status(201).json({ status: 'success', data })
  },

  async update(req: WorkspaceRequest, res: Response<ApiResponse<SdkResponse>>) {
    const id = idParamSchema.parse(req.params.id)
    const input = updateSdkSchema.parse(req.body)
    const data = await sdkService.update(req.workspace.workspaceId, parseProjectId(req), id, input)
    res.json({ status: 'success', data })
  },

  async remove(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const id = idParamSchema.parse(req.params.id)
    await sdkService.delete(req.workspace.workspaceId, parseProjectId(req), id)
    res.status(204).json({ status: 'success', message: 'SDK deleted' })
  },
}