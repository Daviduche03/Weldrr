import jwt from 'jsonwebtoken'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import { workspaceConnectionRepository } from '@/modules/connections/connections.repository'
import { getGitHubUser } from '@/services/github'
import { encryptSecret, decryptSecret } from '@/shared/utils/credential-cipher'
import { logger } from '@/utils/logger'
import type { ConnectionProvider } from '@/db/schema'

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token'

const GITHUB_SCOPES = ['repo'] as const

type GithubStatePayload = { userId: string; workspaceId: string }

function signState(userId: string, workspaceId: string): string {
  return jwt.sign({ userId, workspaceId }, config.jwt.secret, { expiresIn: '10m' })
}

function verifyState(state: string): GithubStatePayload {
  try {
    const payload = jwt.verify(state, config.jwt.secret) as GithubStatePayload
    if (!payload.userId || !payload.workspaceId) throw new Error('missing payload')
    return payload
  } catch {
    throw new AppError(400, 'Invalid or expired OAuth state')
  }
}

function frontendRedirectPath(workspaceId: string, provider: string): string {
  const origin = config.corsOrigins[0] ?? config.appUrl
  return `${origin}/settings?connections=${provider}&workspace=${workspaceId}`
}

export type ConnectionInfo = {
  provider: ConnectionProvider
  connected: boolean
  accountLogin: string | null
  accountName: string | null
  avatarUrl: string | null
  scopes: string[]
}

export type GithubConnectInfo = { url: string }

async function exchangeGithubCode(code: string): Promise<{ accessToken: string; scopes: string[] }> {
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

export const connectionService = {
  async list(workspaceId: string): Promise<ConnectionInfo[]> {
    const rows = await workspaceConnectionRepository.listForWorkspace(workspaceId)
    const providers: ConnectionProvider[] = ['github', 'npm', 'pypi', 'goproxy', 'maven', 'rubygems']
    return providers.map((provider) => {
      const row = rows.find((r) => r.provider === provider)
      return {
        provider,
        connected: !!row,
        accountLogin: row?.accountLogin ?? null,
        accountName: row?.accountName ?? null,
        avatarUrl: row?.avatarUrl ?? null,
        scopes: row?.scopes ?? [],
      }
    })
  },

  async githubAuthorizeUrl(workspaceId: string): Promise<GithubConnectInfo> {
    if (!config.github.clientId) {
      throw new AppError(503, 'GitHub integration is not configured on this server')
    }
    const params = new URLSearchParams({
      client_id: config.github.clientId,
      redirect_uri: config.github.callbackUrl,
      scope: GITHUB_SCOPES.join(' '),
      state: signState('connect', workspaceId),
    })
    return { url: `${GITHUB_AUTHORIZE}?${params.toString()}` }
  },

  async githubCallback(code: string, state: string): Promise<{ redirectUrl: string }> {
    const { workspaceId } = verifyState(state)
    const { accessToken, scopes } = await exchangeGithubCode(code)

    const user = await getGitHubUser(accessToken)
    await workspaceConnectionRepository.upsert(workspaceId, {
      provider: 'github',
      accountLogin: user.login,
      accountName: user.name ?? user.login,
      avatarUrl: user.avatarUrl ?? null,
      tokenEncrypted: encryptSecret(accessToken),
      scopes,
    })

    logger.info({ workspaceId, login: user.login }, 'GitHub connected to workspace')
    return { redirectUrl: frontendRedirectPath(workspaceId, 'github') }
  },

  async saveToken(
    workspaceId: string,
    provider: ConnectionProvider,
    input: { token: string; accountLogin?: string; accountName?: string },
  ): Promise<void> {
    if (!input.token.trim()) {
      throw new AppError(400, 'Token is required')
    }
    await workspaceConnectionRepository.upsert(workspaceId, {
      provider,
      accountLogin: input.accountLogin ?? null,
      accountName: input.accountName ?? null,
      avatarUrl: null,
      tokenEncrypted: encryptSecret(input.token.trim()),
      scopes: [],
    })
    logger.info({ workspaceId, provider }, `${provider} token saved`)
  },

  async disconnect(workspaceId: string, provider: ConnectionProvider): Promise<void> {
    await workspaceConnectionRepository.remove(workspaceId, provider)
    logger.info({ workspaceId, provider }, `${provider} disconnected`)
  },

  /** Decrypted credential for the sandbox pipeline. */
  async getToken(workspaceId: string, provider: ConnectionProvider): Promise<string | null> {
    const row = await workspaceConnectionRepository.findForWorkspaceAndProvider(
      workspaceId,
      provider,
    )
    if (!row) return null
    return decryptSecret(row.tokenEncrypted)
  },

  async getConnection(workspaceId: string, provider: ConnectionProvider) {
    const row = await workspaceConnectionRepository.findForWorkspaceAndProvider(
      workspaceId,
      provider,
    )
    if (!row) return null
    return {
      ...row,
      token: decryptSecret(row.tokenEncrypted),
    }
  },
}
