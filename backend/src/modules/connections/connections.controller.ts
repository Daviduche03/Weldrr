import type { Response } from 'express'
import { connectionService } from '@/modules/connections/connections.service'
import type { WorkspaceRequest } from '@/shared/types/request'
import type { ApiResponse, ApiMessageResponse } from '@/shared/types/response'
import { z } from 'zod'

const saveTokenSchema = z.object({
  provider: z.enum(['npm', 'pypi', 'goproxy', 'maven', 'rubygems']),
  token: z.string().trim().min(1),
  accountLogin: z.string().trim().max(200).optional(),
  accountName: z.string().trim().max(200).optional(),
})

const providerParamSchema = z.object({
  provider: z.enum(['github', 'npm', 'pypi', 'goproxy', 'maven', 'rubygems']),
})

const githubCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})

export const connectionController = {
  async list(req: WorkspaceRequest, res: Response<ApiResponse<unknown[]>>) {
    const data = await connectionService.list(req.workspace.workspaceId)
    res.json({ status: 'success', data })
  },

  async githubAuthUrl(req: WorkspaceRequest, res: Response<ApiResponse<{ url: string }>>) {
    const data = await connectionService.githubAuthorizeUrl(req.workspace.workspaceId)
    res.json({ status: 'success', data })
  },

  async githubCallback(req: { query: unknown }, res: Response) {
    const { code, state } = githubCallbackQuerySchema.parse(req.query)
    const { redirectUrl } = await connectionService.githubCallback(code, state)
    res.redirect(redirectUrl)
  },

  async saveToken(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const input = saveTokenSchema.parse(req.body)
    await connectionService.saveToken(req.workspace.workspaceId, input.provider, {
      token: input.token,
      accountLogin: input.accountLogin,
      accountName: input.accountName,
    })
    res.json({ status: 'success', message: `${input.provider} token saved` })
  },

  async disconnect(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { provider } = providerParamSchema.parse(req.params)
    await connectionService.disconnect(req.workspace.workspaceId, provider)
    res.json({ status: 'success', message: `${provider} disconnected` })
  },
}
