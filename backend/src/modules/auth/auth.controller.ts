import type { Response, NextFunction } from 'express'
import { authService } from '@/modules/auth/auth.service'
import {
  registerSchema,
  loginSchema,
  oauthSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateUserSchema,
} from '@/modules/auth/auth.schema'
import type { AuthRequest } from '@/modules/auth/auth.types'

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name, accountType, company, avatarUrl } =
        registerSchema.parse(req.body)
      const data = await authService.register(
        email,
        password,
        name,
        accountType,
        company,
        avatarUrl,
      )
      res.status(201).json({ status: 'success', data })
    } catch (err) {
      next(err)
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body)
      const data = await authService.login(email, password)
      res.json({ status: 'success', data })
    } catch (err) {
      next(err)
    }
  },

  async oauth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { provider, token } = oauthSchema.parse(req.body)
      const data = await authService.oauth(provider, token)
      res.json({ status: 'success', data })
    } catch (err) {
      next(err)
    }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body)
      const data = await authService.refresh(refreshToken)
      res.json({ status: 'success', data })
    } catch (err) {
      next(err)
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body)
      await authService.logout(refreshToken)
      res.json({ status: 'success', message: 'Logged out' })
    } catch (err) {
      next(err)
    }
  },

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body)
      await authService.forgotPassword(email)
      res.json({
        status: 'success',
        message: 'If an account exists for that email, a reset code has been sent',
      })
    } catch (err) {
      next(err)
    }
  },

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, code, password } = resetPasswordSchema.parse(req.body)
      await authService.resetPassword(email, code, password)
      res.json({ status: 'success', message: 'Password updated successfully' })
    } catch (err) {
      next(err)
    }
  },

  async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, code } = verifyEmailSchema.parse(req.body)
      const user = await authService.verifyEmail(email, code)
      res.json({ status: 'success', data: user })
    } catch (err) {
      next(err)
    }
  },

  async resendVerification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = resendVerificationSchema.parse(req.body)
      await authService.resendVerification(email)
      res.json({ status: 'success', message: 'Verification code sent' })
    } catch (err) {
      next(err)
    }
  },

  async resendPasswordResetCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = resendVerificationSchema.parse(req.body)
      await authService.resendPasswordResetCode(email)
      res.json({
        status: 'success',
        message: 'If an account exists for that email, a reset code has been sent',
      })
    } catch (err) {
      next(err)
    }
  },

  async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = updateUserSchema.parse(req.body)
      const user = await authService.updateProfile(req.user!.sub, data)
      res.json({ status: 'success', data: user })
    } catch (err) {
      next(err)
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.sub)
      res.json({ status: 'success', data: user })
    } catch (err) {
      next(err)
    }
  },
}
