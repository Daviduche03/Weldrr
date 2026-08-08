import crypto from 'node:crypto'
import { pgTable, text, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { workspaces } from '@/db/schema/workspaces'

export const projects = pgTable(
  'projects',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    specType: text('spec_type', {
      enum: ['openapi', 'graphql', 'grpc', 'asyncapi'] as const,
    })
      .notNull()
      .default('openapi'),
    specSource: text('spec_source', {
      enum: ['paste', 'url', 'upload', 'github'] as const,
    }).notNull(),
    gitRepo: jsonb('git_repo').$type<{
      provider: string
      fullName: string
      cloneUrl: string
      defaultBranch: string
      private: boolean
    } | null>(),
    status: text('status', { enum: ['generating', 'ready', 'failed'] as const })
      .notNull()
      .default('generating'),
    docsUrl: text('docs_url').notNull().default(''),
    sdkVersion: text('sdk_version'),
    docsVersion: text('docs_version'),
    sdkLanguages: jsonb('sdk_languages')
      .$type<string[]>()
      .notNull()
      .default([]),
    cliEnabled: boolean('cli_enabled').notNull().default(false),
    /** How generated artifacts reach the team: automerge pushes to main
     *  directly (fast), 'pr' opens a pull request for review. */
    publishMode: text('publish_mode', { enum: ['automerge', 'pr'] as const })
      .notNull()
      .default('automerge'),
    spec: jsonb('spec').$type<Record<string, unknown> | null>(),
    specRaw: text('spec_raw'),
    specUrl: text('spec_url'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    workspaceIdx: index('projects_workspace_idx').on(table.workspaceId),
  }),
)

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert