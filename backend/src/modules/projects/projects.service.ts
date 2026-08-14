import { projectRepository } from '@/modules/projects/projects.repository'
import { activityService } from '@/modules/activity/activity.service'
import { discoveryRepository } from '@/modules/discoveries/discovery.repository'
import { discoveryService } from '@/services/discovery'
import { issueDiscoverySandbox } from '@/modules/sandboxes/sandboxes.service'
import { docsService } from '@/modules/docs/docs.service'
import { versionRepository } from '@/modules/versions/versions.repository'
import { webhookService } from '@/modules/webhooks/webhooks.service'
import { NotFoundError } from '@/middleware/errorHandler'
import { offsetForPage, totalPages } from '@/shared/utils/pagination'
import { logger } from '@/utils/logger'
import type {
  ProjectResponse,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
} from '@/modules/projects/projects.types'
import type { Project } from '@/db/schema'

function toResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    specType: project.specType,
    specSource: project.specSource,
    status: project.status,
    publishMode: project.publishMode,
    docsUrl: project.docsUrl,
    sdkVersion: project.sdkVersion,
    docsVersion: project.docsVersion,
    sdkLanguages: project.sdkLanguages,
    cliEnabled: project.cliEnabled,
    generateDocs: project.generateDocs,
    gitRepo: project.gitRepo,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

export const projectService = {
  async list(workspaceId: string, query: ProjectQuery) {
    const offset = offsetForPage(query.page, query.limit)
    const { data, total } = await projectRepository.findAll({
      workspaceId,
      offset,
      limit: query.limit,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })

    return {
      data: data.map(toResponse),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: totalPages(total, query.limit),
      },
    }
  },

  async getById(workspaceId: string, id: string): Promise<ProjectResponse> {
    const project = await projectRepository.findById(workspaceId, id)
    if (!project) throw new NotFoundError('Project not found')
    return toResponse(project)
  },

  async getDiscovery(workspaceId: string, id: string) {
    const project = await projectRepository.findById(workspaceId, id)
    if (!project) throw new NotFoundError('Project not found')
    const discovery = await discoveryRepository.latestForProject(id)
    if (!discovery) return null
    return {
      status: discovery.status,
      version: discovery.version,
      docsMarkdown: discovery.docsMarkdown,
      endpoints: discovery.endpoints,
      narrative: discovery.narrative,
      error: discovery.error,
      createdAt: discovery.createdAt,
      updatedAt: discovery.updatedAt,
    }
  },

  async rerunDiscovery(workspaceId: string, id: string): Promise<void> {
    const project = await projectRepository.findById(workspaceId, id)
    if (!project) throw new NotFoundError('Project not found')

    if (project.specSource === 'paste' || project.specSource === 'upload') {
      void discoveryService.run(project.id)
    } else {
      void issueDiscoverySandbox(project.id)
    }
  },

  async listVersions(workspaceId: string, id: string) {
    const project = await projectRepository.findById(workspaceId, id)
    if (!project) throw new NotFoundError('Project not found')
    return versionRepository.listForProject(project.id)
  },

  async create(workspaceId: string, input: CreateProjectInput): Promise<ProjectResponse> {
    const project = await projectRepository.create(workspaceId, {
      name: input.name,
      specType: input.specType,
      specSource: input.specSource,
      spec: input.spec ?? null,
      specRaw: input.specRaw ?? null,
      specUrl: input.specUrl ?? null,
      gitRepo: input.gitRepo ?? null,
      status: 'generating',
      docsUrl: '',
      sdkLanguages: input.sdkLanguages ?? [],
      cliEnabled: input.cliEnabled ?? false,
      generateDocs: input.generateDocs ?? true,
      publishMode: input.publishMode ?? 'automerge',
    })

    await activityService.record({
      workspaceId,
      projectId: project.id,
      projectName: project.name,
      action: 'created',
      detail: `Project "${project.name}" created`,
    })

    if (project.specSource === 'paste' || project.specSource === 'upload') {
      if (project.specRaw || project.spec) {
        void discoveryService.run(project.id)
      }
    } else if (project.specSource === 'url' || project.specSource === 'github') {
      void issueDiscoverySandbox(project.id)
    } else if (project.specSource === 'mintlify' && project.specUrl) {
      // No spec to discover — provision the docs repo from the template and
      // import the Mintlify content directly (no agent sandbox involved).
      void docsService.importMintlify(workspaceId, project.id, { repoUrl: project.specUrl }).catch(
        (err) => {
          logger.error({ err, projectId: project.id }, 'Mintlify import failed')
        },
      )
    }

    // Register a push webhook so future repo changes re-trigger discovery → SDK/docs.
    if (project.specSource === 'github' && project.gitRepo) {
      void webhookService.registerForProject(project.id).catch((err) => {
        logger.warn({ err, projectId: project.id }, 'Failed to register push webhook')
      })
    }

    return toResponse(project)
  },

  async update(workspaceId: string, id: string, input: UpdateProjectInput): Promise<ProjectResponse> {
    const existing = await projectRepository.findById(workspaceId, id)
    if (!existing) throw new NotFoundError('Project not found')

    const project = await projectRepository.update(workspaceId, id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.specType !== undefined ? { specType: input.specType } : {}),
      ...(input.specSource !== undefined ? { specSource: input.specSource } : {}),
      ...(input.spec !== undefined ? { spec: input.spec ?? null } : {}),
      ...(input.specRaw !== undefined ? { specRaw: input.specRaw ?? null } : {}),
      ...(input.specUrl !== undefined ? { specUrl: input.specUrl ?? null } : {}),
      ...(input.gitRepo !== undefined ? { gitRepo: input.gitRepo ?? null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.docsUrl !== undefined ? { docsUrl: input.docsUrl } : {}),
      ...(input.sdkLanguages !== undefined ? { sdkLanguages: input.sdkLanguages } : {}),
      ...(input.cliEnabled !== undefined ? { cliEnabled: input.cliEnabled } : {}),
      ...(input.generateDocs !== undefined ? { generateDocs: input.generateDocs } : {}),
      ...(input.publishMode !== undefined ? { publishMode: input.publishMode } : {}),
    })
    if (!project) throw new NotFoundError('Project not found')

    if (input.specRaw !== undefined && input.specRaw !== existing.specRaw) {
      void discoveryService.run(project.id)
    } else if (
      (input.specUrl !== undefined && input.specUrl !== existing.specUrl) ||
      (input.gitRepo !== undefined && input.gitRepo?.cloneUrl !== existing.gitRepo?.cloneUrl)
    ) {
      void issueDiscoverySandbox(project.id)
    }

    if (input.status && input.status !== existing.status) {
      const action = input.status === 'failed' ? 'failed' : 'generated'
      await activityService.record({
        workspaceId,
        projectId: project.id,
        projectName: project.name,
        action,
        detail:
          input.status === 'failed'
            ? `${project.name} failed to generate`
            : `${project.name} is now ${input.status}`,
      })
    }

    return toResponse(project)
  },

  async delete(workspaceId: string, id: string): Promise<void> {
    const existing = await projectRepository.findById(workspaceId, id)
    if (!existing) throw new NotFoundError('Project not found')

    const deleted = await projectRepository.delete(workspaceId, id)
    if (!deleted) throw new NotFoundError('Project not found')

    await activityService.record({
      workspaceId,
      projectId: null,
      projectName: existing.name,
      action: 'deleted',
      detail: `Project "${existing.name}" deleted`,
    })
  },
}