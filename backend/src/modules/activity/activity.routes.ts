import { Router } from 'express'
import { activityController } from '@/modules/activity/activity.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.get('/', authenticate, requireWorkspace, asyncHandler(activityController.list))

export { router as activityRoutes }