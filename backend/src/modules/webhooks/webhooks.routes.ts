import { Router } from 'express'
import { webhookController } from '@/modules/webhooks/webhooks.controller'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

// Public GitHub webhook receiver — payloads are authenticated via the HMAC
// signature (x-hub-signature-256), not a user session.
router.post('/github', asyncHandler(webhookController.github))

export { router as webhookRoutes }