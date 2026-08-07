import { Router } from 'express'
import { workspaceController } from '@/modules/workspace/workspace.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace, requireRole } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.use(authenticate)

router.post('/', asyncHandler(workspaceController.create))

router.use(requireWorkspace)

router.get('/', asyncHandler(workspaceController.get))
router.patch('/', requireRole('owner', 'admin'), asyncHandler(workspaceController.update))
router.delete('/', requireRole('owner'), asyncHandler(workspaceController.remove))

router.get('/members', asyncHandler(workspaceController.listMembers))
router.post('/members', requireRole('owner', 'admin'), asyncHandler(workspaceController.inviteMember))
router.patch('/members/:id', requireRole('owner', 'admin'), asyncHandler(workspaceController.updateMemberRole))
router.delete('/members/:id', requireRole('owner', 'admin'), asyncHandler(workspaceController.removeMember))

export { router as workspaceRoutes }
