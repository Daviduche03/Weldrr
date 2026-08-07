import type { Request } from 'express'

export type AuthProvider = 'google' | 'apple'

export type AccountType = 'developer' | 'team'

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
  accountType: AccountType
  company: string | null
  avatarUrl: string | null
  isEmailVerified: boolean
}

export type LoginResponse = {
  user: UserResponse
  tokens: AuthTokens
}

export type RefreshResponse = AuthTokens

export type OAuthPayload = {
  email: string
  name: string
  sub: string
}

export type AuthRequest = Request & {
  user?: TokenPayload
}