import { Router } from 'express'
import { sdkController } from '@/modules/sdks/sdk.controller'
import { authenticate } from '@/middleware/auth'

const router = Router()

router.get('/', authenticate, sdkController.list)
router.get('/:id', authenticate, sdkController.getById)
router.post('/', authenticate, sdkController.create)
router.patch('/:id', authenticate, sdkController.update)
router.delete('/:id', authenticate, sdkController.delete)

export { router as sdkRoutes }
