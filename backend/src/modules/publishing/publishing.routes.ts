import { Router } from 'express'
import { publishingController } from '@/modules/publishing/publishing.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.use(authenticate, requireWorkspace)

router.post('/:projectId/publish/merge', asyncHandler(publishingController.merge))
router.post('/:projectId/publish/watch', asyncHandler(publishingController.watch))

export { router as publishingRoutes }
