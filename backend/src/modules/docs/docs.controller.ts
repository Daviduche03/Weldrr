import type { Response } from 'express'
import { docsService } from '@/modules/docs/docs.service'
import type { WorkspaceRequest } from '@/shared/types/request'
import type { ApiResponse, ApiMessageResponse } from '@/shared/types/response'
import type { DocsTreeNode } from '@/modules/docs/docs.service'
import { z } from 'zod'

const projectIdParamSchema = z.object({ projectId: z.string().min(1) })

const fileQuerySchema = z.object({
  path: z.string().min(1).max(500),
})

const writeFileSchema = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(2_000_000),
})

export const docsController = {
  async tree(req: WorkspaceRequest, res: Response<ApiResponse<DocsTreeNode[]>>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const data = await docsService.tree(req.workspace.workspaceId, projectId)
    res.json({ status: 'success', data })
  },

  async readFile(req: WorkspaceRequest, res: Response<ApiResponse<{ path: string; content: string; kind: string }>>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const { path } = fileQuerySchema.parse(req.query)
    const data = await docsService.readFile(req.workspace.workspaceId, projectId, path)
    res.json({ status: 'success', data })
  },

  async writeFile(req: WorkspaceRequest, res: Response<ApiResponse<{ path: string }>>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const input = writeFileSchema.parse(req.body)
    const data = await docsService.writeFile(req.workspace.workspaceId, projectId, input)
    res.json({ status: 'success', data })
  },

  async deleteFile(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const { path } = fileQuerySchema.parse(req.query)
    await docsService.deleteFile(req.workspace.workspaceId, projectId, path)
    res.json({ status: 'success', message: 'File deleted' })
  },

  async publish(req: WorkspaceRequest, res: Response<ApiResponse<{ version: string }>>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const data = await docsService.publish(req.workspace.workspaceId, projectId)
    res.json({ status: 'success', data })
  },
}
