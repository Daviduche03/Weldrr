import { Router } from 'express'
import { dashboardController } from '@/modules/dashboard/dashboard.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.get('/', authenticate, requireWorkspace, asyncHandler(dashboardController.get))

export { router as dashboardRoutes }