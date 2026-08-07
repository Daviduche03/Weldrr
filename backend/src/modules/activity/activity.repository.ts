import { getDb } from '@/db/client'
import { activity } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { NewActivity, ActivityRow } from '@/db/schema'

function db() {
  return getDb()
}

export const activityRepository = {
  async create(data: NewActivity): Promise<ActivityRow> {
    const [row] = await db().insert(activity).values(data).returning()
    return row
  },

  async listByWorkspace(
    workspaceId: string,
    opts: { limit: number; offset: number },
  ): Promise<{ data: ActivityRow[]; total: number }> {
    const where = eq(activity.workspaceId, workspaceId)

    const data = await db()
      .select()
      .from(activity)
      .where(where)
      .orderBy(desc(activity.createdAt))
      .limit(opts.limit)
      .offset(opts.offset)

    const totalResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(activity)
      .where(where)

    return { data, total: Number(totalResult[0].count) }
  },
}