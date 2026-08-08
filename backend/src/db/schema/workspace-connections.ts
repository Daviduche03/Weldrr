import crypto from 'node:crypto'
import { pgTable, text, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { workspaces } from '@/db/schema/workspaces'

export const connectionProviders = [
  'github',
  'npm',
  'pypi',
  'goproxy',
  'maven',
  'rubygems',
] as const

export type ConnectionProvider = (typeof connectionProviders)[number]

/**
 * A workspace-scoped integration credential (GitHub OAuth, npm/PyPI tokens,
 * etc). Publishing artifacts is a workspace concern — the sandbox pipeline
 * resolves "the workspace's <provider> credential", not a specific user's.
 */
export const workspaceConnections = pgTable(
  'workspace_connections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: connectionProviders }).notNull(),
    /** Provider-side account/login (e.g. GitHub login, npm username). */
    accountLogin: text('account_login'),
    accountName: text('account_name'),
    avatarUrl: text('avatar_url'),
    /** Encrypted at rest via encryptSecret (AES-256-GCM). */
    tokenEncrypted: text('token_encrypted').notNull(),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true, mode: 'date' }),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    workspaceProviderIdx: uniqueIndex('workspace_connections_ws_provider_idx').on(
      table.workspaceId,
      table.provider,
    ),
    workspaceIdx: index('workspace_connections_workspace_idx').on(table.workspaceId),
  }),
)

export type WorkspaceConnection = typeof workspaceConnections.$inferSelect
export type NewWorkspaceConnection = typeof workspaceConnections.$inferInsert
