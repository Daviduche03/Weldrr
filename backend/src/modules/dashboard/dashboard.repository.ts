import { getDb } from '@/db/client'
import { projects } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

function db() {
  return getDb()
}

export type ProjectStatusCounts = {
  total: number
  ready: number
  generating: number
  failed: number
}

export const dashboardRepository = {
  async countProjectsByStatus(workspaceId: string): Promise<ProjectStatusCounts> {
    const base = eq(projects.workspaceId, workspaceId)
    const rows = await db()
      .select({
        status: projects.status,
        count: sql<number>`count(*)`,
      })
      .from(projects)
      .where(base)
      .groupBy(projects.status)

    const byStatus: Record<string, number> = { ready: 0, generating: 0, failed: 0 }
    let total = 0

    for (const row of rows) {
      byStatus[row.status] = Number(row.count)
      total += Number(row.count)
    }

    return {
      total,
      ready: byStatus.ready,
      generating: byStatus.generating,
      failed: byStatus.failed,
    }
  },
}