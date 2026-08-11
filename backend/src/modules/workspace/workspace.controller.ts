import type { Response } from 'express'
import { workspaceService } from '@/modules/workspace/workspace.service'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  workspaceParamsSchema,
} from '@/modules/workspace/workspace.schema'
import type { WorkspaceRequest } from '@/shared/types/request'
import type {
  ApiMessageResponse,
  ApiResponse,
} from '@/shared/types/response'
import type {
  MemberResponse,
  WorkspaceResponse,
} from '@/modules/workspace/workspace.types'

export const workspaceController = {
  async create(req: WorkspaceRequest, res: Response<ApiResponse<WorkspaceResponse>>) {
    const input = createWorkspaceSchema.parse(req.body)
    const data = await workspaceService.create(req.user.sub, input)
    res.status(201).json({ status: 'success', data })
  },

  async get(req: WorkspaceRequest, res: Response<ApiResponse<WorkspaceResponse>>) {
    const data = await workspaceService.getCurrent(req.user.sub, req.workspace.workspaceId)
    res.json({ status: 'success', data })
  },

  async list(req: WorkspaceRequest, res: Response<ApiResponse<WorkspaceResponse[]>>) {
    const data = await workspaceService.list(req.user.sub)
    res.json({ status: 'success', data })
  },

  async update(req: WorkspaceRequest, res: Response<ApiResponse<WorkspaceResponse>>) {
    const input = updateWorkspaceSchema.parse(req.body)
    const data = await workspaceService.update(req.user.sub, input)
    res.json({ status: 'success', data })
  },

  async remove(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    await workspaceService.delete(req.user.sub)
    res.status(204).json({ status: 'success', message: 'Workspace deleted' })
  },

  async listMembers(req: WorkspaceRequest, res: Response<ApiResponse<MemberResponse[]>>) {
    const data = await workspaceService.listMembers(req.user.sub)
    res.json({ status: 'success', data })
  },

  async inviteMember(req: WorkspaceRequest, res: Response<ApiResponse<MemberResponse>>) {
    const input = inviteMemberSchema.parse(req.body)
    const data = await workspaceService.inviteMember(req.user.sub, input)
    res.status(201).json({ status: 'success', data })
  },

  async updateMemberRole(req: WorkspaceRequest, res: Response<ApiResponse<MemberResponse>>) {
    const { id } = workspaceParamsSchema.parse(req.params)
    const input = updateMemberRoleSchema.parse(req.body)
    const data = await workspaceService.updateMemberRole(req.user.sub, id, input.role)
    res.json({ status: 'success', data })
  },

  async removeMember(req: WorkspaceRequest, res: Response<ApiMessageResponse>) {
    const { id } = workspaceParamsSchema.parse(req.params)
    await workspaceService.removeMember(req.user.sub, id)
    res.json({ status: 'success', message: 'Member removed' })
  },
}