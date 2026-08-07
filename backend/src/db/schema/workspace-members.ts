import crypto from 'node:crypto'
import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { workspaces } from '@/db/schema/workspaces'
import { users } from '@/db/schema/users'

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    role: text('role', { enum: ['owner', 'admin', 'member'] as const })
      .notNull()
      .default('member'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    workspaceEmailIdx: uniqueIndex('workspace_members_email_idx').on(table.workspaceId, table.email),
    workspaceIdx: index('workspace_members_workspace_idx').on(table.workspaceId),
  }),
)

export type WorkspaceMember = typeof workspaceMembers.$inferSelect
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert