import crypto from 'node:crypto'
import { pgTable, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { users } from '@/modules/auth/auth.schema'

export const sdks = pgTable(
  'sdks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    language: text('language', {
      enum: ['typescript', 'python', 'java', 'go', 'ruby', 'php'] as const,
    })
      .notNull()
      .default('typescript'),
    framework: text('framework'),
    spec: jsonb('spec'),
    status: text('status', {
      enum: ['draft', 'generating', 'ready', 'failed'] as const,
    })
      .notNull()
      .default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdx: index('sdks_user_idx').on(table.userId),
  }),
)

export type Sdk = typeof sdks.$inferSelect
export type NewSdk = typeof sdks.$inferInsert

export const createSdkSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  language: z.enum(['typescript', 'python', 'java', 'go', 'ruby', 'php']).default('typescript'),
  framework: z.string().max(100).optional(),
  spec: z.record(z.unknown()).optional(),
})

export const updateSdkSchema = createSdkSchema.partial()

export const sdkQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['draft', 'generating', 'ready', 'failed']).optional(),
  language: z.enum(['typescript', 'python', 'java', 'go', 'ruby', 'php']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
