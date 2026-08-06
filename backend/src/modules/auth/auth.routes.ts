import { Router } from 'express'
import { authController } from '@/modules/auth/auth.controller'
import { authenticate } from '@/middleware/auth'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/oauth', authController.oauth)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.post('/verify-email', authController.verifyEmail)
router.post('/resend-verification', authController.resendVerification)
router.post('/resend-reset-code', authController.resendPasswordResetCode)
router.get('/me', authenticate, authController.me)
router.patch('/me', authenticate, authController.updateMe)

export { router as authRoutes }
