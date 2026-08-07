import { getDb } from '@/db/client'
import {
  users,
  oauthAccounts,
  refreshTokens,
  passwordResetTokens,
  emailVerificationTokens,
} from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import type {
  User,
  NewUser,
  OAuthAccount,
  NewOAuthAccount,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
} from '@/db/schema'
import type { AuthProvider } from '@/modules/auth/auth.types'

function db() {
  return getDb()
}

export const authRepository = {
  async findUserByEmail(email: string): Promise<User | undefined> {
    const result = await db().select().from(users).where(eq(users.email, email))
    return result[0]
  },

  async findUserById(id: string): Promise<User | undefined> {
    const result = await db().select().from(users).where(eq(users.id, id))
    return result[0]
  },

  async createUser(data: NewUser): Promise<User> {
    const [user] = await db().insert(users).values(data).returning()
    return user
  },

  async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
    const [user] = await db()
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning()
    return user
  },

  async findOAuthAccount(provider: AuthProvider, providerId: string): Promise<OAuthAccount | undefined> {
    const result = await db()
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, provider), eq(oauthAccounts.providerId, providerId)))
    return result[0]
  },

  async createOAuthAccount(data: NewOAuthAccount): Promise<void> {
    await db().insert(oauthAccounts).values(data)
  },

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | undefined> {
    const result = await db()
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
    return result[0]
  },

  async createRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await db().insert(refreshTokens).values(data)
  },

  async revokeRefreshToken(id: string): Promise<void> {
    await db().update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, id))
  },

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await db()
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  },

  async createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await db().insert(passwordResetTokens).values(data)
  },

  async findPasswordResetToken(userId: string): Promise<PasswordResetToken | undefined> {
    const result = await db()
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)))
      .orderBy(passwordResetTokens.createdAt)
    return result[result.length - 1]
  },

  async usePasswordResetToken(id: string): Promise<void> {
    await db().update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id))
  },

  async revokeUnusedPasswordResetTokens(userId: string): Promise<void> {
    await db()
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)),
      )
  },

  async markEmailVerified(userId: string): Promise<void> {
    await db()
      .update(users)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
  },

  async createEmailVerificationToken(data: { userId: string; codeHash: string; expiresAt: Date }): Promise<void> {
    await db().insert(emailVerificationTokens).values(data)
  },

  async findEmailVerificationToken(userId: string): Promise<EmailVerificationToken | undefined> {
    const result = await db()
      .select()
      .from(emailVerificationTokens)
      .where(and(eq(emailVerificationTokens.userId, userId), isNull(emailVerificationTokens.usedAt)))
      .orderBy(emailVerificationTokens.createdAt)
    return result[result.length - 1]
  },

  async revokeUnusedVerificationTokens(userId: string): Promise<void> {
    await db()
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(emailVerificationTokens.userId, userId), isNull(emailVerificationTokens.usedAt)))
  },

  async useEmailVerificationToken(id: string): Promise<void> {
    await db().update(emailVerificationTokens).set({ usedAt: new Date() }).where(eq(emailVerificationTokens.id, id))
  },
}