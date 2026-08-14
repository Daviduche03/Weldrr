import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { AppError, NotFoundError } from '@/middleware/errorHandler'
import { projectRepository } from '@/modules/projects/projects.repository'
import { connectionService } from '@/modules/connections/connections.service'
import { config } from '@/config'
import { resolveOpenAiCompatibleProvider } from '@/services/sandbox-runtime'
import {
  listRepoTree,
  readRepoFile,
  writeRepoFile,
  deleteRepoFile,
  commitFiles,
  createGitHubRepo,
  getGitHubRepo,
  getGitHubBlobBase64,
  getRepoDefaultBranch,
  type RepoTreeNode,
} from '@/services/github'
import { planMintlifyImport } from '@/services/mintlify'
import { slugify } from '@/shared/utils/slug'
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

  async chatStream(
    workspaceId: string,
    projectId: string,
    input: {
      messages: {
        role: 'user' | 'assistant'
        content?: string
        text?: string
        parts?: { type: string; text?: string }[]
      }[]
      file?: string
      content?: string
    },
  ): Promise<ReturnType<typeof streamText>> {
    const modelId = config.sandbox.opencodeModel
    const resolved = resolveOpenAiCompatibleProvider(modelId, config.sandbox.providerApiKey)
    if (!resolved) {
      throw new AppError(
        503,
        'AI chat is not configured — set SANDBOX_OPENCODE_MODEL and SANDBOX_PROVIDER_API_KEY to enable it',
      )
    }

    const provider = createOpenAICompatible({
      name: resolved.providerId,
      baseURL: resolved.baseURL,
      apiKey: resolved.apiKey,
    })
    // The openai-compatible endpoint expects the bare model id (the part after
    // the provider prefix), matching how the sandbox's opencode resolves it.
    const model = provider(modelId.split('/').slice(1).join('/') || modelId)

    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new NotFoundError('Project not found')

    let pages: string[] = []
    let fileContext: { path: string; content: string } | null = null
    try {
      const ref = await this.resolveRepo(workspaceId, projectId)
      const nodes = await listRepoTree(ref.accessToken, ref.fullName, ref.branch)
      pages = nodes
        .filter((n) => n.type === 'blob' && isEditable(n.path) && fileType(n.path) === 'mdx')
        .map((n) => n.path)

      if (input.file && isEditable(input.file)) {
        if (input.content) {
          fileContext = { path: input.file, content: input.content.slice(0, 20_000) }
        } else if (nodes.some((n) => n.path === input.file)) {
          const content = await readRepoFile(ref.accessToken, ref.fullName, input.file, ref.branch)
          fileContext = { path: input.file, content: content.slice(0, 20_000) }
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Could not load docs context for AI chat')
    }

    return streamText({
      model,
      system:
        `You are the docs-writing assistant for Weldrr, helping users write and improve the MDX documentation for their project "${project.name}".\n\n` +
        'Rules:\n' +
        '- Write valid Markdown / MDX (standard markdown plus tables, lists, fenced code blocks, blockquotes, inline code).\n' +
        '- Be accurate and grounded in the file content you are given. Never invent APIs, endpoints, or behavior.\n' +
        '- Use clear, concise technical writing.\n' +
        '- When asked for a complete page, return the full MDX. When asked to improve a section, briefly explain, then show the revised markdown in a fenced code block.\n\n' +
        `Pages in this project's docs (src/docs):\n${pages.length ? pages.join('\n') : '(none yet)'}` +
        (fileContext
          ? `\n\nCurrently editing: ${fileContext.path}\n\nCurrent content:\n\`\`\`mdx\n${fileContext.content}\n\`\`\``
          : ''),
      messages: input.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content:
          m.content ??
          m.text ??
          (m.parts
            ?.filter((p) => p.type === 'text' && p.text)
            .map((p) => p.text ?? '')
            .join('') ??
          ''),
      })),
    })
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

  /**
   * Ensures the project has a Weldrr docs repo, provisioning one from the
   * docs template when it doesn't exist yet. Returns the repo reference to
   * write into. This lets a Mintlify import create its own repo without an
   * agent sandbox.
   */
  async ensureDocsRepo(
    workspaceId: string,
    projectId: string,
    token: string,
  ): Promise<{ fullName: string; accessToken: string; branch: string }> {
    const project = await projectRepository.findById(workspaceId, projectId)
    if (!project) throw new NotFoundError('Project not found')

    if (project.docsUrl) {
      return this.resolveRepo(workspaceId, projectId)
    }

    const baseName = `${slugify(project.name) || 'project'}-docs`
    const isPrivate = project.gitRepo?.private ?? false

    let fullName: string
    let cloneUrl: string
    const existing = await getGitHubRepo(token, baseName).catch(() => null)
    if (existing) {
      fullName = fullNameFromUrl(existing.cloneUrl)
      cloneUrl = existing.cloneUrl
    } else {
      let created: { fullName: string; cloneUrl: string } | null = null
      for (let attempt = 0; attempt < 5 && !created; attempt += 1) {
        const name = attempt === 0 ? baseName : `${baseName}-${attempt + 1}`
        try {
          created = await createGitHubRepo(token, {
            name,
            description: `Weldrr docs for ${project.name}`,
            private: isPrivate,
            // Seed an initial commit so the Git Data API accepts our blobs.
            autoInit: true,
          })
        } catch (err) {
          const isConflict = err instanceof AppError && err.statusCode === 409
          if (!isConflict) throw err
          if (attempt === 4) throw err
        }
      }
      if (!created) throw new AppError(500, 'Could not create a docs repository')
      fullName = created.fullName
      cloneUrl = created.cloneUrl
    }

    // Scaffold the site from the docs template (no agent needed).
    const templateUrl = config.sandbox.templates['docs'] ?? ''
    const templateFull = fullNameFromUrl(templateUrl)
    if (templateFull) {
      let templateBranch = 'main'
      try {
        templateBranch = await getRepoDefaultBranch(token, templateFull)
      } catch {
        templateBranch = 'main'
      }
      const templateTree = await listRepoTree(token, templateFull, templateBranch)
      const files: { path: string; content: string; encoding: 'base64' }[] = []
      for (const node of templateTree) {
        if (node.type !== 'blob') continue
        const content = await getGitHubBlobBase64(token, templateFull, node.sha)
        files.push({ path: node.path, content, encoding: 'base64' })
      }
      if (files.length > 0) {
        await commitFiles(token, fullName, {
          branch: 'main',
          files,
          message: 'chore: scaffold docs site from Weldrr template',
        })
      }
    }

    // Record the repo as the project's docs repo.
    await projectRepository.update(workspaceId, projectId, { docsUrl: cloneUrl })
    return { fullName, accessToken: token, branch: 'main' }
  },

  /**
   * Imports a Mintlify docs repo into the project's Weldrr docs repo. Reads
   * the source repo's `mint.json` + `.mdx` pages, flattens Mintlify-specific
   * MDX to plain markdown, maps the page slugs to `src/docs/`, and writes a
   * `branding.json` — all in a single efficient commit via the git data API.
   */
  async importMintlify(
    workspaceId: string,
    projectId: string,
    input: { repoUrl: string },
  ): Promise<{
    imported: number
    navigation: string[]
    branding: Record<string, unknown>
    version: string
  }> {
    const sourceFullName = fullNameFromUrl(input.repoUrl)
    if (!sourceFullName) {
      throw new AppError(400, 'Provide a valid GitHub Mintlify repo URL')
    }

    const connection = await connectionService.getConnection(workspaceId, 'github')
    if (!connection?.token) {
      throw new AppError(400, 'No GitHub connection for this workspace')
    }

    // Where the imported docs land — provision the repo if the project has
    // none yet (no agent sandbox involved).
    const target = await this.ensureDocsRepo(workspaceId, projectId, connection.token)

    // Read the source repo structure + branch.
    let sourceBranch = 'main'
    try {
      sourceBranch = await getRepoDefaultBranch(connection.token, sourceFullName)
    } catch {
      sourceBranch = 'main'
    }
    const tree = await listRepoTree(connection.token, sourceFullName, sourceBranch)

    const sourceFileReads = new Map<string, Promise<string | null>>()
    const sourceRead = (path: string): Promise<string | null> => {
      const existing = sourceFileReads.get(path)
      if (existing) return existing
      const p = readRepoFile(connection.token, sourceFullName, path, sourceBranch).catch(() => null)
      sourceFileReads.set(path, p)
      return p
    }

    const plan = await planMintlifyImport({
      token: connection.token,
      fullName: sourceFullName,
      branch: sourceBranch,
      tree,
      readFile: sourceRead,
    })

    if (plan.files.length === 0) {
      throw new AppError(400, 'No Mintlify pages found to import')
    }

    // Drop template placeholder pages (e.g. src/docs/index.mdx from the
    // scaffold) that the import doesn't cover, so the tree mirrors the source.
    const writtenPaths = new Set(plan.files.map((f) => f.path))
    const targetTree = await listRepoTree(connection.token, target.fullName, target.branch)
    const staleDocs = targetTree
      .filter((n) => n.type === 'blob' && n.path.startsWith('src/docs/') && !writtenPaths.has(n.path))
      .map((n) => n.path)

    // Write branding + all converted pages in one commit.
    const brandingContent = JSON.stringify(plan.branding, null, 2)
    await commitFiles(connection.token, target.fullName, {
      branch: target.branch,
      message: 'docs: import Mintlify docs',
      deletes: staleDocs,
      files: [
        { path: BRANDING_PATH, content: brandingContent },
        ...plan.files.map((f) => ({ path: f.path, content: f.content })),
      ],
    })

    logger.info(
      { projectId, imported: plan.files.length, source: sourceFullName },
      'Mintlify docs imported',
    )
    const latest = await versionRepository.latestForProject(projectId, 'docs')
    const version = nextVersion(latest?.version, 'minor')
    await versionRepository.create({
      workspaceId,
      projectId,
      artifactType: 'docs',
      version,
      notes: `Imported from Mintlify (${sourceFullName})`,
    })
    await projectRepository.update(workspaceId, projectId, { status: 'ready', docsVersion: version })
    return {
      imported: plan.files.length,
      navigation: plan.navigation,
      branding: plan.branding,
      version,
    }
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
