import crypto from 'node:crypto'
import { pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { projects } from '@/db/schema/projects'
import { workspaces } from '@/db/schema/workspaces'

export const artifactTypes = ['sdk', 'docs'] as const

export const versions = pgTable(
  'versions',
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
    artifactType: text('artifact_type', { enum: artifactTypes }).notNull(),
    version: text('version').notNull(),
    sourceRef: text('source_ref'),
    artifactUrl: text('artifact_url'),
    sandboxId: text('sandbox_id'),
    discoveryId: text('discovery_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    projectIdx: index('versions_project_idx').on(table.projectId),
    projectTypeVersionIdx: uniqueIndex('versions_project_type_version_idx').on(
      table.projectId,
      table.artifactType,
      table.version,
    ),
  }),
)

export type Version = typeof versions.$inferSelect
export type NewVersion = typeof versions.$inferInsert
export type ArtifactType = (typeof artifactTypes)[number]
