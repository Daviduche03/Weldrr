import type { Request } from 'express'
import type { TokenPayload } from '@/modules/auth/auth.types'
import type { WorkspaceRole } from '@/modules/workspace/workspace.types'

export type WorkspaceContext = {
  workspaceId: string
  role: WorkspaceRole
}

export type UserRequest = Request & { user: TokenPayload }

export type WorkspaceRequest = UserRequest & { workspace: WorkspaceContext }

export type AuthenticatedRequest = UserRequest