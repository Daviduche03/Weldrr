import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  accountType: z.enum(['developer', 'team']),
  company: z.string().trim().max(200).optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  token: z.string().min(1, 'Token is required'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  code: z.string().min(4, 'Reset code is required').max(4, 'Reset code is 4 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  code: z.string().min(4, 'Verification code is required').max(4, 'Verification code is 4 digits'),
})

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  accountType: z.enum(['developer', 'team']).optional(),
  company: z.string().trim().max(200).optional(),
  avatarUrl: z.string().url().optional(),
})