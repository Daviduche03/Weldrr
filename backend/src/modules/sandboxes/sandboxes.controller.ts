import type { Response } from 'express'
import { sandboxService } from '@/modules/sandboxes/sandboxes.service'
import {
  createSandboxSchema,
  sandboxParamsSchema,
  sandboxQuerySchema,
  startSandboxSchema,
  sandboxCallbackSchema,
  sandboxBootstrapQuerySchema,
} from '@/modules/sandboxes/sandboxes.schema'
import type { WorkspaceRequest } from '@/shared/types/request'
import type {
  ApiMessageResponse,
  ApiResponse,
  PaginatedApiResponse,
} from '@/shared/types/response'
import type { SandboxResponse } from '@/modules/sandboxes/sandboxes.types'

export const sandboxController = {
  async list(req: WorkspaceRequest, res: Response<PaginatedApiResponse<SandboxResponse>>) {
    const query = sandboxQuerySchema.parse(req.query)
    const { data, meta } = await sandboxService.list(req.workspace.workspaceId, query)
    res.json({ status: 'success', data, meta })
  },

  async getById(req: WorkspaceRequest, res: Response<ApiResponse<SandboxResponse>>) {
    const { id } = sandboxParamsSchema.parse(req.params)
    const data = await sandboxService.getById(req.workspace.workspaceId, id)
    res.json({ status: 'success', data })
  },

  async issue(req: WorkspaceRequest, res: Response<ApiResponse<SandboxResponse>>) {
    const input = createSandboxSchema.parse(req.body)
    const data = await sandboxService.issue(req.workspace.workspaceId, input)
    res.status(201).json({ status: 'success', data })
  },

  async start(
    req: WorkspaceRequest,
    res: Response<ApiResponse<{ sessionId: string; tunnelUrl: string }>>,
  ) {
    const { id } = sandboxParamsSchema.parse(req.params)
    const input = startSandboxSchema.parse(req.body)
    const data = await sandboxService.start(req.workspace.workspaceId, id, input)
    res.json({ status: 'success', data })
  },

  async terminate(req: WorkspaceRequest, res: Response<ApiResponse<SandboxResponse>>) {
    const { id } = sandboxParamsSchema.parse(req.params)
    const data = await sandboxService.terminate(req.workspace.workspaceId, id)
    res.json({ status: 'success', data })
  },

  async remove(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { id } = sandboxParamsSchema.parse(req.params)
    await sandboxService.remove(req.workspace.workspaceId, id)
    res.status(204).json({ status: 'success', message: 'Sandbox deleted' })
  },

  async callback(req: { body: unknown }, res: Response<ApiResponse<SandboxResponse>>) {
    const input = sandboxCallbackSchema.parse(req.body)
    const data = await sandboxService.handleCallback(input)
    res.json({ status: 'success', data })
  },

  async bootstrap(req: { query: unknown; params: unknown }, res: Response) {
    const { token } = sandboxBootstrapQuerySchema.parse(req.query)
    const { id } = sandboxParamsSchema.parse(req.params)
    const script = await sandboxService.bootstrap(id, token)
    res
      .type('text/plain')
      .setHeader('Cache-Control', 'no-store')
      .send(script)
  },
}
