import jwt from 'jsonwebtoken'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import { githubRepository } from '@/modules/github/github.repository'
import { workspaceConnectionRepository } from '@/modules/connections/connections.repository'
import { getGitHubUser, listGitHubRepos } from '@/services/github'
import type { GitHubRepo } from '@/services/github'
import { encryptSecret } from '@/shared/utils/credential-cipher'
import { getDb } from '@/db/client'
import { workspaceMembers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/utils/logger'

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token'

const GITHUB_SCOPES = ['repo'] as const

type GithubStatePayload = { userId: string }

function signState(userId: string): string {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: '10m' })
}

function verifyState(state: string): string {
  try {
    const payload = jwt.verify(state, config.jwt.secret) as GithubStatePayload
    if (!payload.userId) throw new Error('missing userId')
    return payload.userId
  } catch {
    throw new AppError(400, 'Invalid or expired OAuth state')
  }
}

function frontendRedirectPath(): string {
  const origin = config.corsOrigins[0] ?? config.appUrl
  return `${origin}/onboarding?github=connected`
}

export type GithubConnectionStatus = {
  connected: boolean
  login?: string
  avatarUrl?: string | null
  scopes?: string[]
}

export type GithubConnectInfo = {
  url: string
}

async function exchangeCode(code: string): Promise<{ accessToken: string; scopes: string[] }> {
  const res = await fetch(GITHUB_TOKEN, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'weldrr',
    },
    body: JSON.stringify({
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: config.github.callbackUrl,
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new AppError(502, `GitHub token exchange failed (HTTP ${res.status})`)
  }

  const data = (await res.json()) as {
    access_token?: string
    scope?: string
    error?: string
    error_description?: string
  }

  if (!data.access_token) {
    throw new AppError(
      401,
      data.error_description ?? data.error ?? 'GitHub authorization failed',
    )
  }

  return {
    accessToken: data.access_token,
    scopes: data.scope ? data.scope.split(',').map((s) => s.trim()) : [],
  }
}

export const githubService = {
  async authorizeUrl(userId: string): Promise<GithubConnectInfo> {
    if (!config.github.clientId) {
      throw new AppError(503, 'GitHub integration is not configured on this server')
    }
    const params = new URLSearchParams({
      client_id: config.github.clientId,
      redirect_uri: config.github.callbackUrl,
      scope: GITHUB_SCOPES.join(' '),
      state: signState(userId),
    })
    return { url: `${GITHUB_AUTHORIZE}?${params.toString()}` }
  },

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ redirectUrl: string }> {
    const userId = verifyState(state)
    const { accessToken, scopes } = await exchangeCode(code)

    const user = await getGitHubUser(accessToken)
    await githubRepository.upsert(userId, {
      providerId: String(user.id),
      accessToken,
      scopes,
    })

    // Mirror into workspace-scoped connections so the publishing pipeline can
    // resolve the credential even when GitHub was connected via onboarding or
    // the new-project repo picker (which are user-scoped flows).
    const memberships = await getDb()
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
    for (const membership of memberships) {
      await workspaceConnectionRepository.upsert(membership.workspaceId, {
        provider: 'github',
        accountLogin: user.login,
        accountName: user.name ?? user.login,
        avatarUrl: user.avatarUrl ?? null,
        tokenEncrypted: encryptSecret(accessToken),
        scopes,
      })
    }

    logger.info({ userId, login: user.login }, 'GitHub account connected')
    return { redirectUrl: frontendRedirectPath() }
  },

  async status(userId: string): Promise<GithubConnectionStatus> {
    const row = await githubRepository.findByUserId(userId)
    if (!row || !row.accessToken) {
      return { connected: false }
    }

    try {
      const user = await getGitHubUser(row.accessToken)
      return {
        connected: true,
        login: user.login,
        avatarUrl: user.avatarUrl,
        scopes: row.scopes,
      }
    } catch {
      return { connected: false }
    }
  },

  async repos(userId: string, query?: string): Promise<GitHubRepo[]> {
    const row = await githubRepository.findByUserId(userId)
    if (!row?.accessToken) {
      throw new AppError(401, 'GitHub is not connected')
    }
    return listGitHubRepos(row.accessToken, { query })
  },

  async disconnect(userId: string): Promise<void> {
    await githubRepository.removeByUserId(userId)
  },
}
