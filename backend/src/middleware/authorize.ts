import type { NextFunction, Request, Response } from 'express'
import { workspaceRepository } from '@/modules/workspace/workspace.repository'
import { AppError, ForbiddenError } from '@/middleware/errorHandler'
import type { WorkspaceRole } from '@/modules/workspace/workspace.types'
import type { WorkspaceContext } from '@/shared/types/request'

export async function requireWorkspace(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as Request & { user?: { sub: string } }).user?.sub
    if (!userId) {
      throw new AppError(401, 'Authentication required')
    }

    const requestedId = (req.headers['x-workspace-id'] as string | undefined)?.trim()

    let membership
    if (requestedId) {
      membership = await workspaceRepository.findMembershipByUserIdAndWorkspace(
        userId,
        requestedId,
      )
      if (!membership) {
        throw new AppError(403, 'You are not a member of that workspace')
      }
    } else {
      membership = await workspaceRepository.findMembershipByUserId(userId)
    }

    if (!membership) {
      throw new AppError(404, 'No workspace found for this user')
    }

    const context: WorkspaceContext = {
      workspaceId: membership.workspaceId,
      role: membership.role,
    }
    ;(req as Request & { workspace: WorkspaceContext }).workspace = context
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRole(...roles: WorkspaceRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const workspace = (req as Request & { workspace?: WorkspaceContext }).workspace
    if (!workspace) {
      throw new AppError(404, 'No workspace found for this user')
    }
    if (!roles.includes(workspace.role)) {
      throw new ForbiddenError()
    }
    next()
  }
}