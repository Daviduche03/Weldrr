import crypto from 'node:crypto'
import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { projects } from '@/db/schema/projects'
import { workspaces } from '@/db/schema/workspaces'

export const discoveryStatuses = ['pending', 'running', 'ready', 'failed'] as const

export const discoveries = pgTable(
  'discoveries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    sandboxId: text('sandbox_id'),
    status: text('status', { enum: discoveryStatuses })
      .notNull()
      .default('pending'),
    version: text('version'),
    docsMarkdown: text('docs_markdown'),
    endpoints: jsonb('endpoints')
      .$type<DiscoveryEndpoint[]>()
      .notNull()
      .default([]),
    narrative: text('narrative'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    projectIdx: index('discoveries_project_idx').on(table.projectId),
    workspaceIdx: index('discoveries_workspace_idx').on(table.workspaceId),
  }),
)

export type DiscoveryEndpoint = {
  method: string
  path: string
  summary: string | null
  operationId: string | null
  requestBody: string | null
  responses: { status: string; schema: string | null }[]
  auth: string | null
}

export type Discovery = typeof discoveries.$inferSelect
export type NewDiscovery = typeof discoveries.$inferInsert
export type DiscoveryStatus = (typeof discoveryStatuses)[number]
