import crypto from 'node:crypto'
import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core'
import { workspaces } from '@/db/schema/workspaces'
import { projects } from '@/db/schema/projects'

export const activity = pgTable(
  'activity',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    projectName: text('project_name').notNull(),
    action: text('action', {
      enum: [
        'workspace_created',
        'created',
        'deleted',
        'spec_updated',
        'generated',
        'failed',
        'released',
        'member_added',
        'member_removed',
        'role_changed',
        'plan_changed',
      ] as const,
    }).notNull(),
    detail: text('detail').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    workspaceIdx: index('activity_workspace_idx').on(table.workspaceId),
  }),
)

export type ActivityRow = typeof activity.$inferSelect
export type NewActivity = typeof activity.$inferInsert