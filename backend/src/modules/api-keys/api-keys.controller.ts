import type { Response } from 'express'
import { apiKeyService } from '@/modules/api-keys/api-keys.service'
import { createApiKeySchema, apiKeyParamsSchema } from '@/modules/api-keys/api-keys.schema'
import type { WorkspaceRequest } from '@/shared/types/request'
import type {
  ApiMessageResponse,
  ApiResponse,
} from '@/shared/types/response'
import type {
  ApiKeyResponse,
  CreateApiKeyResult,
} from '@/modules/api-keys/api-keys.types'

export const apiKeyController = {
  async list(req: WorkspaceRequest, res: Response<ApiResponse<ApiKeyResponse[]>>) {
    const data = await apiKeyService.list(req.workspace.workspaceId)
    res.json({ status: 'success', data })
  },

  async create(req: WorkspaceRequest, res: Response<ApiResponse<CreateApiKeyResult>>) {
    const input = createApiKeySchema.parse(req.body)
    const data = await apiKeyService.create(req.workspace.workspaceId, input)
    res.status(201).json({ status: 'success', data })
  },

  async revoke(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { id } = apiKeyParamsSchema.parse(req.params)
    await apiKeyService.revoke(req.workspace.workspaceId, id)
    res.json({ status: 'success', message: 'API key revoked' })
  },
}