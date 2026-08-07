import crypto from 'node:crypto'
import { pgTable, text, integer, bigint, timestamp } from 'drizzle-orm/pg-core'

export const workspaces = pgTable('workspaces', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan', { enum: ['free', 'pro', 'enterprise'] as const })
    .notNull()
    .default('free'),
  docsServed: bigint('docs_served', { mode: 'number' }).notNull().default(0),
  sdksPublished: integer('sdks_published').notNull().default(0),
  usageDocs: integer('usage_docs').notNull().default(0),
  usageSdks: integer('usage_sdks').notNull().default(0),
  usageCli: integer('usage_cli').notNull().default(0),
  usageMcp: integer('usage_mcp').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert