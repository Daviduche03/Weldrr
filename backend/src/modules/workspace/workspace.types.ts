export type WorkspacePlan = 'free' | 'pro' | 'enterprise'

export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type WorkspaceResponse = {
  id: string
  name: string
  slug: string
  plan: WorkspacePlan
  role: WorkspaceRole
  members: number
  createdAt: Date
  updatedAt: Date
}

export type UpdateWorkspaceInput = {
  name?: string
  slug?: string
  plan?: WorkspacePlan
}

export type CreateWorkspaceInput = {
  name: string
  slug?: string
}

export type MemberResponse = {
  id: string
  email: string
  role: WorkspaceRole
  joinedAt: Date
  accepted: boolean
}

export type InviteMemberInput = {
  email: string
  role: 'admin' | 'member'
}

export type UpdateMemberRoleInput = {
  role: 'admin' | 'member'
}