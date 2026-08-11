import { workspaceRepository } from '@/modules/workspace/workspace.repository'
import { activityService } from '@/modules/activity/activity.service'
import { AppError, ForbiddenError, NotFoundError } from '@/middleware/errorHandler'
import { uniqueSlug } from '@/shared/utils/slug'
import type {
  WorkspaceResponse,
  WorkspaceRole,
  MemberResponse,
  UpdateWorkspaceInput,
  CreateWorkspaceInput,
  InviteMemberInput,
  WorkspacePlan,
} from '@/modules/workspace/workspace.types'
import type { WorkspaceMember } from '@/db/schema'
import type { User } from '@/db/schema'

const ROLE_ORDER: Record<WorkspaceRole, number> = { owner: 0, admin: 1, member: 2 }

function toMemberResponse(member: WorkspaceMember): MemberResponse {
  return {
    id: member.id,
    email: member.email,
    role: member.role,
    joinedAt: member.createdAt,
    accepted: member.userId !== null,
  }
}

function sortMembers(members: WorkspaceMember[]): WorkspaceMember[] {
  return [...members].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
}

async function toWorkspaceResponse(
  workspace: NonNullable<Awaited<ReturnType<typeof workspaceRepository.findById>>>,
  user: User,
): Promise<WorkspaceResponse> {
  const members = await workspaceRepository.listMembers(workspace.id)
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    role: 'owner',
    members: members.length,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  }
}

export const workspaceService = {
  async create(userId: string, input: CreateWorkspaceInput): Promise<WorkspaceResponse> {
    const user = await workspaceRepository.findUserById(userId)
    if (!user) throw new NotFoundError('User not found')

    const slug = input.slug
      ? await (async () => {
          const taken = await workspaceRepository.existsBySlug(input.slug as string)
          if (taken) throw new AppError(409, 'That workspace slug is already taken')
          return input.slug as string
        })()
      : await uniqueSlug(input.name, (s) => workspaceRepository.existsBySlug(s))

    const workspace = await workspaceRepository.create({ name: input.name, slug })
    await workspaceRepository.addMember({
      workspaceId: workspace.id,
      userId: user.id,
      email: user.email,
      role: 'owner',
    })

    await activityService.record({
      workspaceId: workspace.id,
      projectId: null,
      projectName: workspace.name,
      action: 'workspace_created',
      detail: `Workspace ${workspace.name} created`,
    })

    return toWorkspaceResponse(workspace, user)
  },

  async getCurrent(userId: string, workspaceId?: string): Promise<WorkspaceResponse> {
    const membership = workspaceId
      ? await workspaceRepository.findMembershipByUserIdAndWorkspace(userId, workspaceId)
      : await workspaceRepository.findMembershipByUserId(userId)
    if (!membership) throw new NotFoundError('No workspace found for this user')

    const workspace = await workspaceRepository.findById(membership.workspaceId)
    if (!workspace) throw new NotFoundError('Workspace not found')

    const members = await workspaceRepository.listMembers(workspace.id)

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      role: membership.role,
      members: members.length,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    }
  },

  async list(userId: string): Promise<WorkspaceResponse[]> {
    const memberships = await workspaceRepository.listMembershipsByUserId(userId)
    const workspaces: WorkspaceResponse[] = []
    for (const membership of memberships) {
      const workspace = await workspaceRepository.findById(membership.workspaceId)
      if (!workspace) continue
      const members = await workspaceRepository.listMembers(workspace.id)
      workspaces.push({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        role: membership.role,
        members: members.length,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      })
    }
    return workspaces
  },

  async update(userId: string, input: UpdateWorkspaceInput): Promise<WorkspaceResponse> {
    const membership = await workspaceRepository.findMembershipByUserId(userId)
    if (!membership) throw new NotFoundError('No workspace found for this user')

    if (input.plan && membership.role !== 'owner') {
      throw new ForbiddenError('Only the workspace owner can change the plan')
    }

    const current = await workspaceRepository.findById(membership.workspaceId)
    if (!current) throw new NotFoundError('Workspace not found')

    if (input.slug && input.slug !== current.slug) {
      const taken = await workspaceRepository.findBySlug(input.slug)
      if (taken && taken.id !== membership.workspaceId) {
        throw new AppError(409, 'That workspace slug is already taken')
      }
    }

    const workspace = await workspaceRepository.update(membership.workspaceId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.plan !== undefined ? { plan: input.plan as WorkspacePlan } : {}),
    })
    if (!workspace) throw new AppError(500, 'Failed to update workspace')

    if (input.plan !== undefined && input.plan !== current.plan) {
      await activityService.record({
        workspaceId: workspace.id,
        projectId: null,
        projectName: workspace.name,
        action: 'plan_changed',
        detail: `Plan changed to ${input.plan}`,
      })
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      role: membership.role,
      members: (await workspaceRepository.listMembers(workspace.id)).length,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    }
  },

  async delete(userId: string): Promise<void> {
    const membership = await workspaceRepository.findMembershipByUserId(userId)
    if (!membership) throw new NotFoundError('No workspace found for this user')
    if (membership.role !== 'owner') throw new ForbiddenError('Only the owner can delete the workspace')

    await workspaceRepository.deleteWorkspace(membership.workspaceId)
  },

  async listMembers(userId: string): Promise<MemberResponse[]> {
    const membership = await workspaceRepository.findMembershipByUserId(userId)
    if (!membership) throw new NotFoundError('No workspace found for this user')

    const members = await workspaceRepository.listMembers(membership.workspaceId)
    return sortMembers(members).map(toMemberResponse)
  },

  async inviteMember(userId: string, input: InviteMemberInput): Promise<MemberResponse> {
    const membership = await workspaceRepository.findMembershipByUserId(userId)
    if (!membership) throw new NotFoundError('No workspace found for this user')

    const existing = await workspaceRepository.findMembershipByEmail(membership.workspaceId, input.email)
    if (existing) throw new AppError(409, 'That email is already a member')

    const user = await workspaceRepository.findUserByEmail(input.email)
    const member = await workspaceRepository.addMember({
      workspaceId: membership.workspaceId,
      userId: user?.id ?? null,
      email: input.email,
      role: input.role,
    })

    await activityService.record({
      workspaceId: membership.workspaceId,
      projectId: null,
      projectName: input.email,
      action: 'member_added',
      detail: `${input.email} invited as ${input.role}`,
    })

    return toMemberResponse(member)
  },

  async updateMemberRole(userId: string, memberId: string, role: WorkspaceRole): Promise<MemberResponse> {
    const membership = await workspaceRepository.findMembershipByUserId(userId)
    if (!membership) throw new NotFoundError('No workspace found for this user')

    if (!['admin', 'member'].includes(role)) {
      throw new AppError(400, 'Invalid role')
    }

    const target = await workspaceRepository.findMemberById(memberId)
    if (!target || target.workspaceId !== membership.workspaceId) {
      throw new NotFoundError('Member not found')
    }
    if (target.role === 'owner') {
      throw new AppError(400, 'The owner role cannot be changed')
    }

    const updated = await workspaceRepository.updateMemberRole(memberId, role as 'admin' | 'member')
    if (!updated) throw new AppError(500, 'Failed to update member role')

    await activityService.record({
      workspaceId: membership.workspaceId,
      projectId: null,
      projectName: target.email,
      action: 'role_changed',
      detail: `${target.email} is now a ${role}`,
    })

    return toMemberResponse(updated)
  },

  async removeMember(userId: string, memberId: string): Promise<void> {
    const membership = await workspaceRepository.findMembershipByUserId(userId)
    if (!membership) throw new NotFoundError('No workspace found for this user')

    const target = await workspaceRepository.findMemberById(memberId)
    if (!target || target.workspaceId !== membership.workspaceId) {
      throw new NotFoundError('Member not found')
    }
    if (target.role === 'owner') {
      throw new AppError(400, 'The owner cannot be removed from the workspace')
    }

    await workspaceRepository.removeMember(memberId)

    await activityService.record({
      workspaceId: membership.workspaceId,
      projectId: null,
      projectName: target.email,
      action: 'member_removed',
      detail: `${target.email} removed from workspace`,
    })
  },
}