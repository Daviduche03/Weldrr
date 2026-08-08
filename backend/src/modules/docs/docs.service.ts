import { AppError, NotFoundError } from '@/middleware/errorHandler'
import { projectRepository } from '@/modules/projects/projects.repository'
import { connectionService } from '@/modules/connections/connections.service'
import {
  listRepoTree,
  readRepoFile,
  writeRepoFile,
  deleteRepoFile,
  getRepoDefaultBranch,
  type RepoTreeNode,
} from '@/services/github'
import { versionRepository } from '@/modules/versions/versions.repository'
import { nextVersion } from '@/services/versioning'
import { publishingService } from '@/services/publishing'
import { logger } from '@/utils/logger'

type RepoRef = { fullName: string; accessToken: string; branch: string }

function fullNameFromUrl(url: string | null): string {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const match = /^github\.com$/.test(parsed.hostname)
    if (!match) return ''
    return parsed.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '')
  } catch {
    return ''
  }
}

const EDITABLE_PREFIX = 'src/docs'
const BRANDING_PATH = 'branding.json'

function isEditable(path: string): boolean {
  return (
    path === EDITABLE_PREFIX ||
    path.startsWith(`${EDITABLE_PREFIX}/`) ||
    path === BRANDING_PATH ||
    path.startsWith('public/')
  )
}

function fileType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    mdx: 'mdx',
    md: 'md',
    tsx: 'tsx',
    ts: 'ts',
    json: 'json',
    css: 'css',
    js: 'js',
    html: 'html',
    yaml: 'yaml',
    yml: 'yaml',
  }
  return map[ext] ?? 'txt'
}

export type DocsTreeNode = {
  path: string
  name: string
  type: 'tree' | 'blob'
  editable: boolean
  kind: string
  sha: string
}

export const docsService = {
  async resolveRepo(workspaceId: string, projectId: string): Promise<RepoRef> {
    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new NotFoundError('Project not found')

    const fullName = fullNameFromUrl(project.docsUrl)
    if (!fullName) {
      throw new AppError(400, 'This project has no docs repository yet — generate docs first')
    }

    const connection = await connectionService.getConnection(workspaceId, 'github')
    if (!connection?.token) {
      throw new AppError(400, 'No GitHub connection for this workspace')
    }

    let branch: string
    try {
      const defaultBranch = await getRepoDefaultBranch(connection.token, fullName)
      branch = ['main', 'master'].includes(defaultBranch) ? defaultBranch : 'main'
    } catch {
      branch = 'main'
    }

    return {
      fullName,
      accessToken: connection.token,
      branch,
    }
  },

  async tree(workspaceId: string, projectId: string): Promise<DocsTreeNode[]> {
    const ref = await this.resolveRepo(workspaceId, projectId)
    let nodes: RepoTreeNode[]
    try {
      nodes = await listRepoTree(ref.accessToken, ref.fullName, ref.branch)
    } catch (err) {
      throw new AppError(
        502,
        `Could not read docs repo (${err instanceof Error ? err.message : 'unknown error'})`,
      )
    }

    return nodes.map((n) => {
      const name = n.path.split('/').pop() ?? n.path
      return {
        path: n.path,
        name,
        type: n.type,
        editable: n.type === 'blob' && isEditable(n.path),
        kind: n.type === 'blob' ? fileType(n.path) : 'folder',
        sha: n.sha,
      }
    })
  },

  async readFile(
    workspaceId: string,
    projectId: string,
    path: string,
  ): Promise<{ path: string; content: string; kind: string }> {
    const ref = await this.resolveRepo(workspaceId, projectId)
    if (!isEditable(path)) throw new AppError(403, 'This file is read-only')
    const content = await readRepoFile(ref.accessToken, ref.fullName, path, ref.branch)
    return { path, content, kind: fileType(path) }
  },

  async readBranding(
    workspaceId: string,
    projectId: string,
  ): Promise<Record<string, unknown>> {
    const ref = await this.resolveRepo(workspaceId, projectId)
    try {
      const raw = await readRepoFile(ref.accessToken, ref.fullName, BRANDING_PATH, ref.branch)
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  },

  async writeFile(
    workspaceId: string,
    projectId: string,
    input: { path: string; content: string },
  ): Promise<{ path: string; mode?: 'automerge' | 'pr'; prNumber?: number; prUrl?: string }> {
    if (!isEditable(input.path)) throw new AppError(403, 'This file is read-only')
    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new NotFoundError('Project not found')

    // In PR mode, editor saves open a pull request instead of pushing to main.
    if (project.publishMode === 'pr') {
      const result = await publishingService.writeArtifact(workspaceId, projectId, {
        kind: 'docs',
        files: [{ path: input.path, content: input.content }],
        message: `docs: update ${input.path}`,
        title: `Update ${input.path}`,
        body: 'Auto-generated by Weldrr from the in-app docs editor.',
      })
      logger.info({ projectId, path: input.path }, 'Docs file change opened as PR')
      return {
        path: input.path,
        mode: result.mode,
        prNumber: result.prNumber,
        prUrl: result.prUrl,
      }
    }

    const ref = await this.resolveRepo(workspaceId, projectId)
    await writeRepoFile(ref.accessToken, ref.fullName, {
      path: input.path,
      content: input.content,
      message: `docs: update ${input.path}`,
      branch: ref.branch,
    })
    logger.info({ projectId, path: input.path }, 'Docs file saved')
    return { path: input.path, mode: 'automerge' }
  },

  async deleteFile(workspaceId: string, projectId: string, path: string): Promise<{ path: string }> {
    if (!isEditable(path)) throw new AppError(403, 'This file is read-only')
    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new NotFoundError('Project not found')

    if (project.publishMode === 'pr') {
      await publishingService.writeArtifact(workspaceId, projectId, {
        kind: 'docs',
        files: [],
        deletes: [path],
        message: `docs: delete ${path}`,
        title: `Delete ${path}`,
        body: 'Auto-generated by Weldrr from the in-app docs editor.',
      })
      return { path }
    }

    const ref = await this.resolveRepo(workspaceId, projectId)
    await deleteRepoFile(ref.accessToken, ref.fullName, path, `docs: delete ${path}`, ref.branch)
    logger.info({ projectId, path }, 'Docs file deleted')
    return { path }
  },

  /**
   * Persists branding config + assets to the docs repo. `config` is written
   * to branding.json (utf-8); each entry in `assets` is written to
   * public/<filename> as base64.
   */
  async writeBranding(
    workspaceId: string,
    projectId: string,
    input: {
      config: Record<string, unknown>
      assets?: { path: string; base64: string }[]
    },
  ): Promise<{ path: string }> {
    const allowedAssets = /^public\/[\w.-]+\.(svg|png|jpg|jpeg|webp|ico)$/i
    for (const asset of input.assets ?? []) {
      if (!allowedAssets.test(asset.path)) {
        throw new AppError(400, `Invalid asset path: ${asset.path}`)
      }
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(asset.base64) || asset.base64.length > 5_000_000) {
        throw new AppError(400, `Invalid base64 payload for ${asset.path}`)
      }
    }

    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new NotFoundError('Project not found')

    const files: { path: string; content: string; encoding?: 'utf-8' | 'base64' }[] = [
      { path: BRANDING_PATH, content: JSON.stringify(input.config, null, 2) },
      ...(input.assets ?? []).map((a) => ({
        path: a.path,
        content: a.base64,
        encoding: 'base64' as const,
      })),
    ]

    if (project.publishMode === 'pr') {
      await publishingService.writeArtifact(workspaceId, projectId, {
        kind: 'docs',
        files,
        message: 'docs: update branding',
        title: 'Update branding',
        body: 'Auto-generated by Weldrr from the branding settings.',
      })
      return { path: BRANDING_PATH }
    }

    const ref = await this.resolveRepo(workspaceId, projectId)
    for (const file of files) {
      await writeRepoFile(ref.accessToken, ref.fullName, {
        path: file.path,
        content: file.content,
        message: 'docs: update branding',
        branch: ref.branch,
        encoding: file.encoding,
      })
    }

    logger.info({ projectId }, 'Branding updated')
    return { path: BRANDING_PATH }
  },

  async publish(workspaceId: string, projectId: string): Promise<{ version: string }> {
    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new NotFoundError('Project not found')

    const latest = await versionRepository.latestForProject(projectId, 'docs')
    const version = nextVersion(latest?.version, 'patch')
    await versionRepository.create({
      workspaceId,
      projectId,
      artifactType: 'docs',
      version,
      notes: 'Published from the in-app editor',
    })
    await projectRepository.update(workspaceId, projectId, { docsVersion: version })
    logger.info({ projectId, version }, 'Docs published from editor')
    return { version }
  },
}
