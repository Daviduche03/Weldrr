import { Router } from 'express'
import { githubController } from '@/modules/github/github.controller'
import { authenticate } from '@/middleware/auth'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

// OAuth callback — reached by the browser after GitHub authorization.
router.get('/callback', asyncHandler(githubController.callback))

router.use(authenticate)

router.get('/auth-url', asyncHandler(githubController.authUrl))
router.get('/status', asyncHandler(githubController.status))
router.get('/repos', asyncHandler(githubController.repos))
router.delete('/connection', asyncHandler(githubController.disconnect))

export { router as githubRoutes }
