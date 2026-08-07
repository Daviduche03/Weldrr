import crypto from 'node:crypto'
import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { workspaces } from '@/db/schema/workspaces'
import { projects } from '@/db/schema/projects'

export const sandboxJobTypes = ['discovery', 'sdk', 'docs'] as const
export const sandboxLanguages = ['typescript', 'python', 'java', 'go', 'ruby', 'php'] as const
export const sandboxStatuses = [
  'issuing',
  'starting',
  'ready',
  'building',
  'finished',
  'failed',
  'terminated',
] as const

export const sandboxes = pgTable(
  'sandboxes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    jobType: text('job_type', { enum: sandboxJobTypes }).notNull().default('sdk'),
    language: text('language', { enum: sandboxLanguages }),
    status: text('status', { enum: sandboxStatuses }).notNull().default('issuing'),
    modalSandboxId: text('modal_sandbox_id'),
    tunnelUrl: text('tunnel_url'),
    opencodePassword: text('opencode_password'),
    artifactUrl: text('artifact_url'),
    version: text('version'),
    callbackTokenHash: text('callback_token_hash').notNull(),
    spec: jsonb('spec').$type<Record<string, unknown> | null>(),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    workspaceIdx: index('sandboxes_workspace_idx').on(table.workspaceId),
    projectIdx: index('sandboxes_project_idx').on(table.projectId),
  }),
)

export type Sandbox = typeof sandboxes.$inferSelect
export type NewSandbox = typeof sandboxes.$inferInsert

export type SandboxJobType = (typeof sandboxJobTypes)[number]
export type SandboxLanguage = (typeof sandboxLanguages)[number]
export type SandboxStatus = (typeof sandboxStatuses)[number]
