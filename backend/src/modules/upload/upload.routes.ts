import { Router } from 'express'
import { uploadController, uploadMiddleware } from '@/modules/upload/upload.controller'
import { authenticate } from '@/middleware/auth'

const router = Router()

router.post('/', authenticate, uploadMiddleware.single('file'), uploadController.uploadFile)

export { router as uploadRoutes }
