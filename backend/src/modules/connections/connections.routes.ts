import { Router } from 'express'
import { connectionController } from '@/modules/connections/connections.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

// OAuth callback — reached by the browser after GitHub authorization.
router.get('/github/callback', asyncHandler(connectionController.githubCallback))

router.use(authenticate, requireWorkspace)

router.get('/', asyncHandler(connectionController.list))
router.get('/github/auth-url', asyncHandler(connectionController.githubAuthUrl))
router.post('/tokens', asyncHandler(connectionController.saveToken))
router.delete('/:provider', asyncHandler(connectionController.disconnect))

export { router as connectionRoutes }
