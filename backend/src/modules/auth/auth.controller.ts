import type { Request, Response } from 'express'
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
import type { UserRequest } from '@/shared/types/request'
import type { ApiMessageResponse, ApiResponse } from '@/shared/types/response'
import type { LoginResponse, RefreshResponse, UserResponse } from '@/modules/auth/auth.types'

export const authController = {
  async register(req: Request, res: Response<ApiResponse<LoginResponse>>) {
    const input = registerSchema.parse(req.body)
    const data = await authService.register(
      input.email,
      input.password,
      input.name,
      input.accountType,
      input.company,
      input.avatarUrl,
    )
    res.status(201).json({ status: 'success', data })
  },

  async login(req: Request, res: Response<ApiResponse<LoginResponse>>) {
    const input = loginSchema.parse(req.body)
    const data = await authService.login(input.email, input.password)
    res.json({ status: 'success', data })
  },

  async oauth(req: Request, res: Response<ApiResponse<LoginResponse>>) {
    const input = oauthSchema.parse(req.body)
    const data = await authService.oauth(input.provider, input.token)
    res.json({ status: 'success', data })
  },

  async refresh(req: Request, res: Response<ApiResponse<RefreshResponse>>) {
    const input = refreshSchema.parse(req.body)
    const data = await authService.refresh(input.refreshToken)
    res.json({ status: 'success', data })
  },

  async logout(req: Request, res: Response<ApiMessageResponse>) {
    const input = refreshSchema.parse(req.body)
    await authService.logout(input.refreshToken)
    res.json({ status: 'success', message: 'Logged out' })
  },

  async forgotPassword(req: Request, res: Response<ApiMessageResponse>) {
    const input = forgotPasswordSchema.parse(req.body)
    await authService.forgotPassword(input.email)
    res.json({
      status: 'success',
      message: 'If an account exists for that email, a reset code has been sent',
    })
  },

  async resendPasswordResetCode(req: Request, res: Response<ApiMessageResponse>) {
    const input = forgotPasswordSchema.parse(req.body)
    await authService.resendPasswordResetCode(input.email)
    res.json({
      status: 'success',
      message: 'If an account exists for that email, a reset code has been sent',
    })
  },

  async resetPassword(req: Request, res: Response<ApiMessageResponse>) {
    const body = resetPasswordSchema.parse(req.body)
    await authService.resetPassword(body.email, body.code, body.password)
    res.json({ status: 'success', message: 'Password updated successfully' })
  },

  async verifyEmail(req: Request, res: Response<ApiResponse<UserResponse>>) {
    const body = verifyEmailSchema.parse(req.body)
    const user = await authService.verifyEmail(body.email, body.code)
    res.json({ status: 'success', data: user })
  },

  async resendVerification(req: Request, res: Response<ApiMessageResponse>) {
    const input = resendVerificationSchema.parse(req.body)
    await authService.resendVerification(input.email)
    res.json({ status: 'success', message: 'Verification code sent' })
  },

  async me(req: UserRequest, res: Response<ApiResponse<UserResponse>>) {
    const user = await authService.getProfile(req.user.sub)
    res.json({ status: 'success', data: user })
  },

  async updateMe(req: UserRequest, res: Response<ApiResponse<UserResponse>>) {
    const data = updateUserSchema.parse(req.body)
    const user = await authService.updateProfile(req.user.sub, data)
    res.json({ status: 'success', data: user })
  },
}