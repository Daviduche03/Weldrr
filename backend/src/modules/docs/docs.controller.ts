import type { Response } from 'express'
import { pipeUIMessageStreamToResponse } from 'ai'
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

const brandingSchema = z.object({
  config: z.record(z.unknown()),
  assets: z
    .array(
      z.object({
        path: z.string().min(1).max(200),
        base64: z.string().max(5_000_000),
      }),
    )
    .optional(),
})

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(50_000).optional(),
  text: z.string().max(50_000).optional(),
  parts: z
    .array(
      z.union([
        z.object({ type: z.literal('text'), text: z.string() }),
        z.object({ type: z.string(), text: z.string().optional() }),
      ]),
    )
    .optional(),
})

const chatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  file: z.string().max(500).optional(),
  content: z.string().max(100_000).optional(),
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

  async readBranding(
    req: WorkspaceRequest,
    res: Response<ApiResponse<Record<string, unknown>>>,
  ) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const data = await docsService.readBranding(req.workspace.workspaceId, projectId)
    res.json({ status: 'success', data })
  },

  async writeBranding(req: WorkspaceRequest, res: Response<ApiResponse<{ path: string }>>) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const input = brandingSchema.parse(req.body)
    const data = await docsService.writeBranding(req.workspace.workspaceId, projectId, input)
    res.json({ status: 'success', data })
  },

  async chat(req: WorkspaceRequest, res: Response) {
    const { projectId } = projectIdParamSchema.parse(req.params)
    const input = chatSchema.parse(req.body)

    const result = await docsService.chatStream(req.workspace.workspaceId, projectId, input)
    await pipeUIMessageStreamToResponse({
      response: res,
      stream: result.toUIMessageStream(),
    })
  },

  async writeFile(
    req: WorkspaceRequest,
    res: Response<ApiResponse<{ path: string; mode?: 'automerge' | 'pr'; prNumber?: number; prUrl?: string }>>,
  ) {
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
