import crypto from 'node:crypto'
import { pgTable, text, timestamp, uniqueIndex, jsonb } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['google', 'apple', 'github'] as const }).notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    providerIdx: uniqueIndex('oauth_provider_idx').on(table.provider, table.providerId),
  }),
)

export type OAuthAccount = typeof oauthAccounts.$inferSelect
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert