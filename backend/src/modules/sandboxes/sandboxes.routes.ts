import { Router } from 'express'
import { sandboxController } from '@/modules/sandboxes/sandboxes.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace, requireRole } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

// Token-authenticated endpoints reached from inside the sandbox — no user auth.
router.post('/callback', asyncHandler(sandboxController.callback))
router.get('/:id/bootstrap', asyncHandler(sandboxController.bootstrap))

// Everything below requires a signed-in user with a workspace.
router.use(authenticate, requireWorkspace)

router.get('/', asyncHandler(sandboxController.list))
router.get('/:id', asyncHandler(sandboxController.getById))
router.post('/', requireRole('owner', 'admin'), asyncHandler(sandboxController.issue))
router.post(
  '/:id/start',
  requireRole('owner', 'admin'),
  asyncHandler(sandboxController.start),
)
router.post(
  '/:id/terminate',
  requireRole('owner', 'admin'),
  asyncHandler(sandboxController.terminate),
)
router.delete('/:id', requireRole('owner', 'admin'), asyncHandler(sandboxController.remove))

export { router as sandboxRoutes }
