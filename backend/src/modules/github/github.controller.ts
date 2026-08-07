import type { Response } from 'express'
import { githubService } from '@/modules/github/github.service'
import type { UserRequest } from '@/shared/types/request'
import type { ApiResponse, ApiMessageResponse } from '@/shared/types/response'
import type { GithubConnectionStatus, GithubConnectInfo } from '@/modules/github/github.service'
import type { GitHubRepo } from '@/services/github'
import { z } from 'zod'

const githubCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})

const githubReposQuerySchema = z.object({
  query: z.string().trim().max(100).optional(),
})

export const githubController = {
  async authUrl(req: UserRequest, res: Response<ApiResponse<GithubConnectInfo>>) {
    const data = await githubService.authorizeUrl(req.user.sub)
    res.json({ status: 'success', data })
  },

  async callback(req: { query: unknown }, res: Response) {
    const { code, state } = githubCallbackQuerySchema.parse(req.query)
    const { redirectUrl } = await githubService.handleCallback(code, state)
    res.redirect(redirectUrl)
  },

  async status(req: UserRequest, res: Response<ApiResponse<GithubConnectionStatus>>) {
    const data = await githubService.status(req.user.sub)
    res.json({ status: 'success', data })
  },

  async repos(req: UserRequest, res: Response<ApiResponse<GitHubRepo[]>>) {
    const { query } = githubReposQuerySchema.parse(req.query)
    const data = await githubService.repos(req.user.sub, query)
    res.json({ status: 'success', data })
  },

  async disconnect(req: UserRequest, res: Response<ApiMessageResponse>) {
    await githubService.disconnect(req.user.sub)
    res.json({ status: 'success', message: 'GitHub disconnected' })
  },
}
