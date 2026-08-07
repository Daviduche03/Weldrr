import { Router } from 'express'
import { authController } from '@/modules/auth/auth.controller'
import { authenticate } from '@/middleware/auth'
import { asyncHandler } from '@/shared/utils/async-handler'

const router = Router()

router.post('/register', asyncHandler(authController.register))
router.post('/login', asyncHandler(authController.login))
router.post('/oauth', asyncHandler(authController.oauth))
router.post('/refresh', asyncHandler(authController.refresh))
router.post('/logout', asyncHandler(authController.logout))
router.post('/forgot-password', asyncHandler(authController.forgotPassword))
router.post('/reset-password', asyncHandler(authController.resetPassword))
router.post('/verify-email', asyncHandler(authController.verifyEmail))
router.post('/resend-verification', asyncHandler(authController.resendVerification))
router.post('/resend-reset-code', asyncHandler(authController.resendPasswordResetCode))
router.get('/me', authenticate, asyncHandler(authController.me))
router.patch('/me', authenticate, asyncHandler(authController.updateMe))

export { router as authRoutes }