import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { config } from '@/config'
import { authRepository } from '@/modules/auth/auth.repository'
import { verifyOAuthToken } from '@/modules/auth/oauth'
import { AppError, NotFoundError } from '@/middleware/errorHandler'
import { sendTemplateEmail } from '@/services/zeptomail'
import { emailTemplates } from '@/services/email-templates'
import type {
  TokenPayload,
  AuthTokens,
  UserResponse,
  LoginResponse,
  RefreshResponse,
} from '@/modules/auth/auth.types'
import type { NewUser, User } from '@/db/schema'
import type { AuthProvider } from '@/modules/auth/auth.types'

const OTP_EXPIRY_MINUTES = 15
const OTP_LENGTH = 4

function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions)
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateOtp(): string {
  return crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH).toString()
}

function validateUser(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    accountType: user.accountType,
    company: user.company ?? null,
    avatarUrl: user.avatarUrl ?? null,
    isEmailVerified: user.isEmailVerified,
  }
}

function refreshTokenExpiry(): Date {
  const ms = /^(\d+)d$/.exec(config.jwt.refreshExpiresIn)?.[1]
  const days = ms ? Number(ms) : 30
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + days)
  return expiry
}

async function createTokens(userId: string, email: string): Promise<AuthTokens> {
  const payload: TokenPayload = { sub: userId, email }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken()
  const tokenHash = hashToken(refreshToken)

  await authRepository.createRefreshToken({
    userId,
    tokenHash,
    expiresAt: refreshTokenExpiry(),
  })

  return { accessToken, refreshToken }
}

async function sendVerificationOtp(user: { id: string; email: string; name: string }): Promise<void> {
  const code = generateOtp()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)

  await authRepository.revokeUnusedVerificationTokens(user.id)
  await authRepository.createEmailVerificationToken({
    userId: user.id,
    codeHash: hashToken(code),
    expiresAt,
  })

  try {
    await sendTemplateEmail({
      to: user.email,
      toName: user.name,
      templateKey: emailTemplates.verification_otp.key,
      mergeInfo: {
        NAME: user.name.split(' ')[0],
        OTP: code,
        EXPIRY_MINUTES: String(OTP_EXPIRY_MINUTES),
      },
    })
  } catch (err) {
    console.error('Failed to send verification email:', err)
  }
}

async function issuePasswordResetCode(user: { id: string; email: string; name: string }): Promise<void> {
  const code = generateOtp()
  const codeHash = hashToken(code)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES)

  await authRepository.revokeUnusedPasswordResetTokens(user.id)
  await authRepository.createPasswordResetToken({
    userId: user.id,
    tokenHash: codeHash,
    expiresAt,
  })

  try {
    await sendTemplateEmail({
      to: user.email,
      toName: user.name,
      templateKey: emailTemplates.password_reset.key,
      mergeInfo: {
        NAME: user.name.split(' ')[0],
        CODE: code,
        EXPIRY_MINUTES: String(OTP_EXPIRY_MINUTES),
      },
    })
  } catch (err) {
    console.error('Failed to send password reset email:', err)
  }
}

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    accountType: 'developer' | 'team',
    company?: string,
    avatarUrl?: string,
  ): Promise<LoginResponse> {
    const existing = await authRepository.findUserByEmail(email)
    if (existing) throw new AppError(409, 'Email already registered')

    const passwordHash = await hashPassword(password)
    const user = await authRepository.createUser({
      email,
      name,
      accountType,
      company,
      avatarUrl,
      passwordHash,
    })

    const tokens = await createTokens(user.id, user.email)
    await sendVerificationOtp(user)

    return { user: validateUser(user), tokens }
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await authRepository.findUserByEmail(email)
    if (!user?.passwordHash) throw new AppError(401, 'Invalid email or password')

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) throw new AppError(401, 'Invalid email or password')

    const tokens = await createTokens(user.id, user.email)
    return { user: validateUser(user), tokens }
  },

  async oauth(provider: AuthProvider, token: string): Promise<LoginResponse> {
    const { email, name, sub } = await verifyOAuthToken(provider, token)
    const accountType: 'developer' | 'team' = 'developer'

    const existingAccount = await authRepository.findOAuthAccount(provider, sub)
    if (existingAccount) {
      const user = await authRepository.findUserById(existingAccount.userId)
      if (!user) throw new AppError(500, 'User not found')
      const tokens = await createTokens(user.id, user.email)
      return { user: validateUser(user), tokens }
    }

    const existingUser = await authRepository.findUserByEmail(email)
    if (existingUser) {
      await authRepository.createOAuthAccount({ userId: existingUser.id, provider, providerId: sub })
      const tokens = await createTokens(existingUser.id, existingUser.email)
      return { user: validateUser(existingUser), tokens }
    }

    const user = await authRepository.createUser({ email, name, accountType, isEmailVerified: true })
    await authRepository.createOAuthAccount({ userId: user.id, provider, providerId: sub })

    const tokens = await createTokens(user.id, user.email)
    return { user: validateUser(user), tokens }
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const tokenHash = hashToken(refreshToken)
    const stored = await authRepository.findRefreshToken(tokenHash)
    if (!stored) throw new AppError(401, 'Invalid or expired refresh token')

    if (stored.expiresAt < new Date()) {
      await authRepository.revokeRefreshToken(stored.id)
      throw new AppError(401, 'Refresh token expired')
    }

    const user = await authRepository.findUserById(stored.userId)
    if (!user) throw new AppError(401, 'User not found')

    await authRepository.revokeRefreshToken(stored.id)
    return createTokens(user.id, user.email)
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken)
    const stored = await authRepository.findRefreshToken(tokenHash)
    if (stored) {
      await authRepository.revokeRefreshToken(stored.id)
    }
  },

  async logoutAll(userId: string): Promise<void> {
    await authRepository.revokeAllUserRefreshTokens(userId)
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email)
    if (user?.passwordHash) {
      await issuePasswordResetCode(user)
    }
  },

  async resendPasswordResetCode(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email)
    if (user?.passwordHash) {
      await issuePasswordResetCode(user)
    }
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email)
    if (!user?.passwordHash) throw new AppError(401, 'Invalid or expired reset code')

    const stored = await authRepository.findPasswordResetToken(user.id)
    if (!stored) throw new AppError(401, 'Invalid or expired reset code')

    if (stored.expiresAt < new Date()) {
      await authRepository.usePasswordResetToken(stored.id)
      throw new AppError(401, 'Invalid or expired reset code')
    }

    if (stored.tokenHash !== hashToken(code)) {
      throw new AppError(401, 'Invalid or expired reset code')
    }

    const passwordHash = await hashPassword(newPassword)
    await authRepository.updateUser(user.id, { passwordHash })
    await authRepository.usePasswordResetToken(stored.id)
    await authRepository.revokeAllUserRefreshTokens(user.id)
  },

  async updateProfile(userId: string, data: Partial<NewUser>): Promise<UserResponse> {
    const user = await authRepository.findUserById(userId)
    if (!user) throw new NotFoundError('User not found')
    const updated = await authRepository.updateUser(userId, data)
    if (!updated) throw new AppError(500, 'Failed to update profile')
    return validateUser(updated)
  },

  async verifyEmail(email: string, code: string): Promise<UserResponse> {
    const user = await authRepository.findUserByEmail(email)
    if (!user) throw new AppError(404, 'No account found with that email')
    if (!user.passwordHash) throw new AppError(400, 'OAuth accounts are already verified')
    if (user.isEmailVerified) throw new AppError(400, 'Email is already verified')

    const stored = await authRepository.findEmailVerificationToken(user.id)
    if (!stored) throw new AppError(401, 'No verification code found — please request a new one')

    if (stored.expiresAt < new Date()) {
      await authRepository.useEmailVerificationToken(stored.id)
      throw new AppError(401, 'Verification code expired — please request a new one')
    }

    if (stored.codeHash !== hashToken(code)) {
      throw new AppError(401, 'Invalid verification code')
    }

    await authRepository.markEmailVerified(user.id)
    await authRepository.useEmailVerificationToken(stored.id)

    return validateUser({ ...user, isEmailVerified: true })
  },

  async resendVerification(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email)
    if (!user) throw new AppError(404, 'No account found with that email')
    if (!user.passwordHash) throw new AppError(400, 'OAuth accounts are already verified')
    if (user.isEmailVerified) throw new AppError(400, 'Email is already verified')

    await sendVerificationOtp(user)
  },

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await authRepository.findUserById(userId)
    if (!user) throw new NotFoundError('User not found')
    return validateUser(user)
  },
}