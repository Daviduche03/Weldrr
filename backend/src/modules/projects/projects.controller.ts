import type { Response } from 'express'
import { projectService } from '@/modules/projects/projects.service'
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  projectParamsSchema,
} from '@/modules/projects/projects.schema'
import type { WorkspaceRequest } from '@/shared/types/request'
import type {
  ApiMessageResponse,
  ApiResponse,
  PaginatedApiResponse,
} from '@/shared/types/response'
import type { ProjectResponse } from '@/modules/projects/projects.types'

export const projectController = {
  async list(req: WorkspaceRequest, res: Response<PaginatedApiResponse<ProjectResponse>>) {
    const query = projectQuerySchema.parse(req.query)
    const { data, meta } = await projectService.list(req.workspace.workspaceId, query)
    res.json({ status: 'success', data, meta })
  },

  async getById(req: WorkspaceRequest, res: Response<ApiResponse<ProjectResponse>>) {
    const { id } = projectParamsSchema.parse(req.params)
    const data = await projectService.getById(req.workspace.workspaceId, id)
    res.json({ status: 'success', data })
  },

  async getDiscovery(req: WorkspaceRequest, res: Response) {
    const { id } = projectParamsSchema.parse(req.params)
    const data = await projectService.getDiscovery(req.workspace.workspaceId, id)
    res.json({ status: 'success', data })
  },

  async rerunDiscovery(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { id } = projectParamsSchema.parse(req.params)
    await projectService.rerunDiscovery(req.workspace.workspaceId, id)
    res.json({ status: 'success', message: 'Discovery scheduled' })
  },

  async listVersions(req: WorkspaceRequest, res: Response) {
    const { id } = projectParamsSchema.parse(req.params)
    const data = await projectService.listVersions(req.workspace.workspaceId, id)
    res.json({ status: 'success', data })
  },

  async create(req: WorkspaceRequest, res: Response<ApiResponse<ProjectResponse>>) {
    const input = createProjectSchema.parse(req.body)
    const data = await projectService.create(req.workspace.workspaceId, input)
    res.status(201).json({ status: 'success', data })
  },

  async update(req: WorkspaceRequest, res: Response<ApiResponse<ProjectResponse>>) {
    const { id } = projectParamsSchema.parse(req.params)
    const input = updateProjectSchema.parse(req.body)
    const data = await projectService.update(req.workspace.workspaceId, id, input)
    res.json({ status: 'success', data })
  },

  async remove(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { id } = projectParamsSchema.parse(req.params)
    await projectService.delete(req.workspace.workspaceId, id)
    res.status(204).json({ status: 'success', message: 'Project deleted' })
  },
}