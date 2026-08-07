import { getDb } from '@/db/client'
import { discoveries } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Discovery, NewDiscovery } from '@/db/schema'

function db() {
  return getDb()
}

export const discoveryRepository = {
  async create(data: Pick<NewDiscovery, 'projectId' | 'workspaceId' | 'status'>): Promise<Discovery> {
    const [row] = await db().insert(discoveries).values(data).returning()
    return row
  },

  async update(id: string, data: Partial<NewDiscovery>): Promise<Discovery | undefined> {
    const [row] = await db()
      .update(discoveries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(discoveries.id, id))
      .returning()
    return row
  },

  async latestForProject(projectId: string): Promise<Discovery | undefined> {
    const [row] = await db()
      .select()
      .from(discoveries)
      .where(eq(discoveries.projectId, projectId))
      .orderBy(desc(discoveries.createdAt))
      .limit(1)
    return row
  },

  async findBySandboxId(sandboxId: string): Promise<Discovery | undefined> {
    const [row] = await db()
      .select()
      .from(discoveries)
      .where(eq(discoveries.sandboxId, sandboxId))
    return row
  },
}
