import { Router } from 'express'
import { docsController } from '@/modules/docs/docs.controller'
import { authenticate } from '@/middleware/auth'
import { requireWorkspace } from '@/middleware/authorize'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.use(authenticate, requireWorkspace)

router.get('/:projectId/docs/tree', asyncHandler(docsController.tree))
router.get('/:projectId/docs/file', asyncHandler(docsController.readFile))
router.put('/:projectId/docs/file', asyncHandler(docsController.writeFile))
router.delete('/:projectId/docs/file', asyncHandler(docsController.deleteFile))
router.post('/:projectId/docs/publish', asyncHandler(docsController.publish))
router.get('/:projectId/docs/branding', asyncHandler(docsController.readBranding))
router.put('/:projectId/docs/branding', asyncHandler(docsController.writeBranding))

export { router as docsRoutes }
