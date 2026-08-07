import { Router } from 'express'
import { apiKeyController } from '@/modules/api-keys/api-keys.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace, requireRole } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.use(authenticate, requireWorkspace)

router.get('/', asyncHandler(apiKeyController.list))
router.post('/', requireRole('owner', 'admin'), asyncHandler(apiKeyController.create))
router.delete('/:id', requireRole('owner', 'admin'), asyncHandler(apiKeyController.revoke))

export { router as apiKeyRoutes }