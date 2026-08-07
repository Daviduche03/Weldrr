import { Router } from 'express'
import { projectController } from '@/modules/projects/projects.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace, requireRole } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.use(authenticate, requireWorkspace)

router.get('/', asyncHandler(projectController.list))
router.get('/:id', asyncHandler(projectController.getById))
router.get('/:id/discovery', asyncHandler(projectController.getDiscovery))
router.get('/:id/versions', asyncHandler(projectController.listVersions))
router.post('/:id/discovery', requireRole('owner', 'admin'), asyncHandler(projectController.rerunDiscovery))
router.post('/', asyncHandler(projectController.create))
router.patch('/:id', requireRole('owner', 'admin'), asyncHandler(projectController.update))
router.delete('/:id', requireRole('owner', 'admin'), asyncHandler(projectController.remove))

export { router as projectRoutes }