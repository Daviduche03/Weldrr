import type { Request } from 'express'

export type AuthProvider = 'google' | 'apple'

export type TokenPayload = {
  sub: string
  email: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type UserResponse = {
  id: string
  email: string
  name: string
  accountType: 'developer' | 'team'
  company: string | null
  avatarUrl: string | null
  isEmailVerified: boolean
}

export type LoginResponse = {
  user: UserResponse
  tokens: AuthTokens
}

export type AuthRequest = Request & {
  user?: TokenPayload
}
