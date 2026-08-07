import crypto from 'node:crypto'
import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { projects } from '@/db/schema/projects'
import { workspaces } from '@/db/schema/workspaces'

export const sdks = pgTable(
  'sdks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    language: text('language', {
      enum: ['typescript', 'python', 'java', 'go', 'ruby', 'php'] as const,
    })
      .notNull()
      .default('typescript'),
    status: text('status', { enum: ['draft', 'generating', 'ready', 'failed'] as const })
      .notNull()
      .default('draft'),
    spec: jsonb('spec').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    workspaceIdx: index('sdks_workspace_idx').on(table.workspaceId),
    projectIdx: index('sdks_project_idx').on(table.projectId),
  }),
)

export type SdkRow = typeof sdks.$inferSelect
export type NewSdk = typeof sdks.$inferInsert