import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import { connectionService } from '@/modules/connections/connections.service'
import { projectRepository } from '@/modules/projects/projects.repository'
import { getRepoDefaultBranch } from '@/services/github'
import { logger } from '@/utils/logger'
import type { Project } from '@/db/schema'

const BREEZE_PROVIDER = 'breezecloud' as const

type BreezeApp = {
  id: string
  name: string
  url: string
  repo_owner: string
  repo_name: string
  branch: string
  auto_deploy: boolean
}

type AppListResponse = { apps: BreezeApp[] }
type AppResponse = { app: BreezeApp }
type CreateAppResponse = { app: BreezeApp; warning?: string }

type RepoRef = { owner: string; name: string }

function repoFromUrl(url: string | null): RepoRef | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'github.com') return null
    const [owner, name] = parsed.pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.git$/, '')
      .split('/')
    if (!owner || !name) return null
    return { owner, name }
  } catch {
    return null
  }
}

function appName(projectName: string): string {
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${slug || 'project'}-docs`
}

async function breezeRequest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${config.breezecloud.apiUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(30_000),
  })

  const text = await res.text()
  let body: Record<string, unknown> | null = null
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>
    } catch {
      body = null
    }
  }

  if (!res.ok) {
    const message =
      typeof body?.error === 'string'
        ? body.error
        : `BreezeCloud request failed (HTTP ${res.status})`
    throw new AppError(502, `BreezeCloud: ${message}`)
  }

  return body as T
}

async function findExistingApp(
  token: string,
  repo: RepoRef,
): Promise<BreezeApp | undefined> {
  const { apps } = await breezeRequest<AppListResponse>(token, '/apps')
  return apps.find(
    (app) => app.repo_owner === repo.owner && app.repo_name === repo.name,
  )
}

const breezecloudService = {
  /**
   * Creates the BreezeCloud app that serves a project's generated docs, if it
   * does not exist yet. The first release is queued by BreezeCloud on create.
   * Returns null when the workspace has not connected BreezeCloud.
   */
  async ensureDocsApp(workspaceId: string, projectId: string): Promise<BreezeApp | null> {
    const token = await connectionService.getToken(workspaceId, BREEZE_PROVIDER)
    if (!token) return null

    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) return null

    const repo = repoFromUrl(project.docsUrl)
    if (!repo) return null

    const name = appName(project.name)

    if (project.breezeAppId) {
      const stored = await breezeRequest<AppResponse>(
        token,
        `/apps/${project.breezeAppId}`,
      ).catch(() => null)
      if (stored?.app) return stored.app
    }

    const existing = await findExistingApp(token, repo)
    if (existing) {
      await projectRepository.update(workspaceId, project.id, {
        breezeAppId: existing.id,
        breezeDocsUrl: existing.url || project.breezeDocsUrl,
      })
      logger.info({ projectId, appId: existing.id }, 'Reused existing BreezeCloud docs app')
      return existing
    }

    let branch = 'main'
    const githubToken = await connectionService.getToken(workspaceId, 'github')
    if (githubToken) {
      branch = await getRepoDefaultBranch(
        githubToken,
        `${repo.owner}/${repo.name}`,
      ).catch(() => 'main')
    }

    let created: CreateAppResponse
    try {
      created = await breezeRequest<CreateAppResponse>(token, '/apps', {
        method: 'POST',
        body: JSON.stringify({
          name,
          repo_owner: repo.owner,
          repo_name: repo.name,
          branch,
          process: 'web',
        }),
      })
    } catch (err) {
      // Another request may have created it between the list and the create.
      const raced = await findExistingApp(token, repo).catch(() => undefined)
      if (raced) {
        await projectRepository.update(workspaceId, project.id, {
          breezeAppId: raced.id,
          breezeDocsUrl: raced.url || project.breezeDocsUrl,
        })
        return raced
      }
      throw err
    }

    await projectRepository.update(workspaceId, project.id, {
      breezeAppId: created.app.id,
      breezeDocsUrl: created.app.url || project.breezeDocsUrl,
    })
    logger.info(
      { projectId, appId: created.app.id, repo: `${repo.owner}/${repo.name}` },
      'Created BreezeCloud docs app',
    )
    return created.app
  },

  /**
   * Queues a release for the docs app. App creation already queues the first
   * release; this is for redeploying an app that already exists (for example
   * after connecting BreezeCloud for a project whose docs were generated
   * earlier).
   */
  async deployDocs(
    workspaceId: string,
    projectId: string,
  ): Promise<{ appId: string; url: string }> {
    const token = await connectionService.getToken(workspaceId, BREEZE_PROVIDER)
    if (!token) {
      throw new AppError(400, 'Connect BreezeCloud in Settings → Connections first')
    }

    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new AppError(404, 'Project not found')
    if (!project.breezeAppId) {
      const app = await this.ensureDocsApp(workspaceId, projectId)
      if (!app) {
        throw new AppError(
          400,
          'This project has no generated docs repository yet — generate docs first',
        )
      }
      return { appId: app.id, url: app.url || project.breezeDocsUrl || '' }
    }

    await breezeRequest(token, `/apps/${project.breezeAppId}/deploys`, {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const { app } = await breezeRequest<AppResponse>(
      token,
      `/apps/${project.breezeAppId}`,
    )
    if (app.url !== project.breezeDocsUrl) {
      await projectRepository.update(workspaceId, project.id, {
        breezeDocsUrl: app.url,
      })
    }
    logger.info({ projectId, appId: app.id }, 'Queued BreezeCloud docs release')
    return { appId: app.id, url: app.url }
  },

  /** Fire-and-forget convenience for the docs generation pipeline. */
  async ensureDocsDeployment(workspaceId: string, projectId: string): Promise<void> {
    try {
      await this.ensureDocsApp(workspaceId, projectId)
    } catch (err) {
      logger.error({ err, projectId }, 'Failed to ensure BreezeCloud docs app')
    }
  },
}

export { breezecloudService }
export type { BreezeApp }
