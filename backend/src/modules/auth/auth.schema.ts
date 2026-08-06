import crypto from 'node:crypto'
import { pgTable, text, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { z } from 'zod'

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  accountType: text('account_type', { enum: ['developer', 'team'] as const })
    .notNull()
    .default('developer'),
  company: text('company'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  isEmailVerified: boolean('is_email_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['google', 'apple'] as const }).notNull(),
    providerId: text('provider_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    providerIdx: uniqueIndex('oauth_provider_idx').on(table.provider, table.providerId),
  }),
)

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type OAuthAccount = typeof oauthAccounts.$inferSelect
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert
export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  accountType: z.enum(['developer', 'team']),
  company: z.string().max(200).optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
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
  email: z.string().email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().min(4, 'Reset code is required').max(4, 'Reset code is 4 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().min(4, 'Verification code is required').max(4, 'Verification code is 4 digits'),
})

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  accountType: z.enum(['developer', 'team']).optional(),
  company: z.string().max(200).optional(),
  avatarUrl: z.string().url().optional(),
})
