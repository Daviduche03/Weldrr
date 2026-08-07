import { getDb } from '@/db/client'
import { sdks } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { SdkRow, NewSdk } from '@/db/schema'

function db() {
  return getDb()
}

export const sdkRepository = {
  async listForProject(workspaceId: string, projectId: string): Promise<SdkRow[]> {
    return db()
      .select()
      .from(sdks)
      .where(and(eq(sdks.workspaceId, workspaceId), eq(sdks.projectId, projectId)))
      .orderBy(sdks.createdAt)
  },

  async findById(workspaceId: string, id: string): Promise<SdkRow | undefined> {
    const [row] = await db()
      .select()
      .from(sdks)
      .where(and(eq(sdks.workspaceId, workspaceId), eq(sdks.id, id)))
    return row
  },

  async create(
    workspaceId: string,
    projectId: string,
    data: Omit<NewSdk, 'workspaceId' | 'projectId'>,
  ): Promise<SdkRow> {
    const [row] = await db()
      .insert(sdks)
      .values({ ...data, workspaceId, projectId })
      .returning()
    return row
  },

  async update(workspaceId: string, id: string, data: Partial<NewSdk>): Promise<SdkRow | undefined> {
    const [row] = await db()
      .update(sdks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(sdks.workspaceId, workspaceId), eq(sdks.id, id)))
      .returning()
    return row
  },

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const [deleted] = await db()
      .delete(sdks)
      .where(and(eq(sdks.workspaceId, workspaceId), eq(sdks.id, id)))
      .returning({ id: sdks.id })
    return deleted !== undefined
  },
}