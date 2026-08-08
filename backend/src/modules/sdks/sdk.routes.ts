import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { sdkController } from '@/modules/sdks/sdk.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace, requireRole } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'
import { z } from 'zod'

const sdkParamsSchema = z.object({
  projectId: z.string().uuid('Invalid project id'),
  id: z.string().uuid('Invalid sdk id').optional(),
})

function validateParams(req: Request, _res: Response, next: NextFunction): void {
  sdkParamsSchema.parse(req.params)
  next()
}

const router = Router()

router.use(authenticate, requireWorkspace)

router.get('/:projectId/sdks', validateParams, asyncHandler(sdkController.list))
router.post(
  '/:projectId/sdks',
  requireRole('owner', 'admin'),
  validateParams,
  asyncHandler(sdkController.create),
)
router.patch(
  '/:projectId/sdks/:id',
  requireRole('owner', 'admin'),
  validateParams,
  asyncHandler(sdkController.update),
)
router.delete(
  '/:projectId/sdks/:id',
  requireRole('owner', 'admin'),
  validateParams,
  asyncHandler(sdkController.remove),
)

// Read-only SDK source viewer.
router.get(
  '/:projectId/sdks/:language/tree',
  validateParams,
  asyncHandler(sdkController.tree),
)
router.get(
  '/:projectId/sdks/:language/file',
  validateParams,
  asyncHandler(sdkController.readFile),
)

export { router as sdkRoutes }