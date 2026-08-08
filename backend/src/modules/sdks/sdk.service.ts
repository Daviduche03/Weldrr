import { sdkRepository } from '@/modules/sdks/sdk.repository'
import { projectRepository } from '@/modules/projects/projects.repository'
import { githubRepository } from '@/modules/github/github.repository'
import { versionRepository } from '@/modules/versions/versions.repository'
import { activityService } from '@/modules/activity/activity.service'
import { AppError, NotFoundError } from '@/middleware/errorHandler'
import { listRepoTree, readRepoFile, getRepoDefaultBranch, getGitHubUser, type RepoTreeNode } from '@/services/github'
import { slugify } from '@/shared/utils/slug'
import type { SdkResponse, CreateSdkInput, UpdateSdkInput, SdkLanguage } from '@/modules/sdks/sdk.types'
import type { SdkRow } from '@/db/schema'
import { logger } from '@/utils/logger'

function toResponse(sdk: SdkRow): SdkResponse {
  return {
    id: sdk.id,
    projectId: sdk.projectId,
    name: sdk.name,
    language: sdk.language,
    status: sdk.status,
    createdAt: sdk.createdAt,
    updatedAt: sdk.updatedAt,
  }
}

async function assertProjectInWorkspace(workspaceId: string, projectId: string): Promise<void> {
  const project = await projectRepository.findById(workspaceId, projectId)
  if (!project) throw new NotFoundError('Project not found')
}

export type SdkTreeNode = {
  path: string
  name: string
  type: 'tree' | 'blob'
  kind: string
  sha: string
}

const SDK_BRANCH = 'main'

function fileKind(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'ts',
    tsx: 'tsx',
    js: 'js',
    mjs: 'js',
    cjs: 'js',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    json: 'json',
    md: 'md',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'toml',
    lock: 'txt',
  }
  return map[ext] ?? 'txt'
}

function fullNameFromUrl(url: string | null): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'github.com') return ''
    return parsed.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '')
  } catch {
    return ''
  }
}

async function resolveSdkRepo(
  workspaceId: string,
  projectId: string,
  language: string,
): Promise<{ fullName: string; accessToken: string; branch: string }> {
  const project = await projectRepository.findById(workspaceId, projectId)
  if (!project) throw new NotFoundError('Project not found')

  const connection = await githubRepository.findForWorkspace(workspaceId)
  if (!connection?.accessToken) {
    throw new AppError(400, 'No GitHub connection for this workspace')
  }

  const user = await getGitHubUser(connection.accessToken)

  // Prefer the real published repo (the artifact URL recorded when the build
  // pushed). The naive `{project}-sdk-{lang}` name can point at a stale empty
  // repo when a build retried and landed on a `-2`/`-3` suffixed repo.
  let fullName = ''
  try {
    const latest = await versionRepository.latestForProject(projectId, 'sdk')
    fullName = latest?.artifactUrl ? fullNameFromUrl(latest.artifactUrl) : ''
  } catch {
    fullName = ''
  }
  if (!fullName) {
    const baseName = `${slugify(project.name) || 'project'}-sdk${language ? `-${slugify(language)}` : ''}`
    fullName = `${user.login}/${baseName}`
  }

  let branch = SDK_BRANCH
  try {
    branch = await getRepoDefaultBranch(connection.accessToken, fullName)
  } catch {
    branch = SDK_BRANCH
  }

  return { fullName, accessToken: connection.accessToken, branch }
}

function toSdkTree(nodes: RepoTreeNode[]): SdkTreeNode[] {
  return nodes.map((n) => {
    const name = n.path.split('/').pop() ?? n.path
    return {
      path: n.path,
      name,
      type: n.type,
      kind: n.type === 'blob' ? fileKind(n.path) : 'folder',
      sha: n.sha,
    }
  })
}

export const sdkService = {
  async list(workspaceId: string, projectId: string): Promise<SdkResponse[]> {
    await assertProjectInWorkspace(workspaceId, projectId)
    const rows = await sdkRepository.listForProject(workspaceId, projectId)
    return rows.map(toResponse)
  },

  async create(workspaceId: string, projectId: string, input: CreateSdkInput): Promise<SdkResponse> {
    await assertProjectInWorkspace(workspaceId, projectId)

    const sdk = await sdkRepository.create(workspaceId, projectId, {
      name: input.name,
      language: input.language ?? 'typescript',
      spec: input.spec ?? null,
      status: 'generating',
    })

    await activityService.record({
      workspaceId,
      projectId,
      projectName: sdk.name,
      action: 'generated',
      detail: `Started generating ${sdk.language} SDK "${sdk.name}"`,
    })

    return toResponse(sdk)
  },

  async update(
    workspaceId: string,
    projectId: string,
    id: string,
    input: UpdateSdkInput,
  ): Promise<SdkResponse> {
    await assertProjectInWorkspace(workspaceId, projectId)

    const existing = await sdkRepository.findById(workspaceId, id)
    if (!existing || existing.projectId !== projectId) throw new NotFoundError('SDK not found')

    const sdk = await sdkRepository.update(workspaceId, id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
    if (!sdk) throw new NotFoundError('SDK not found')

    return toResponse(sdk)
  },

  async delete(workspaceId: string, projectId: string, id: string): Promise<void> {
    await assertProjectInWorkspace(workspaceId, projectId)

    const existing = await sdkRepository.findById(workspaceId, id)
    if (!existing || existing.projectId !== projectId) throw new NotFoundError('SDK not found')

    await sdkRepository.delete(workspaceId, id)
  },

  async tree(
    workspaceId: string,
    projectId: string,
    language: string,
  ): Promise<SdkTreeNode[]> {
    const ref = await resolveSdkRepo(workspaceId, projectId, language)
    try {
      const nodes = await listRepoTree(ref.accessToken, ref.fullName, ref.branch)
      return toSdkTree(nodes)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error'
      if (message.includes('409') || message.includes('404') || message.includes('Not Found')) {
        logger.warn({ projectId, language }, 'SDK repo empty or missing branch')
        return []
      }
      throw new AppError(502, `Could not read SDK repo (${message})`)
    }
  },

  async readFile(
    workspaceId: string,
    projectId: string,
    language: string,
    path: string,
  ): Promise<{ path: string; content: string; kind: string }> {
    const ref = await resolveSdkRepo(workspaceId, projectId, language)
    const content = await readRepoFile(ref.accessToken, ref.fullName, path, ref.branch)
    return { path, content, kind: fileKind(path) }
  },
}