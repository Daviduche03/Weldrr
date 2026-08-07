import { getDb } from '@/db/client'
import { apiKeys } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import type { ApiKey, NewApiKey } from '@/db/schema'

function db() {
  return getDb()
}

export const apiKeyRepository = {
  async listActive(workspaceId: string): Promise<ApiKey[]> {
    return db()
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.workspaceId, workspaceId), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt))
  },

  async findById(workspaceId: string, id: string): Promise<ApiKey | undefined> {
    const [row] = await db()
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.workspaceId, workspaceId), eq(apiKeys.id, id)))
    return row
  },

  async create(workspaceId: string, data: Omit<NewApiKey, 'workspaceId'>): Promise<ApiKey> {
    const [row] = await db().insert(apiKeys).values({ ...data, workspaceId }).returning()
    return row
  },

  async revoke(workspaceId: string, id: string): Promise<boolean> {
    const [row] = await db()
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.workspaceId, workspaceId), eq(apiKeys.id, id), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id })
    return row !== undefined
  },
}