import { getDb } from '@/db/client'
import { workspaceConnections } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { WorkspaceConnection, NewWorkspaceConnection, ConnectionProvider } from '@/db/schema'

function db() {
  return getDb()
}

export const workspaceConnectionRepository = {
  async findForWorkspaceAndProvider(
    workspaceId: string,
    provider: ConnectionProvider,
  ): Promise<WorkspaceConnection | undefined> {
    const [row] = await db()
      .select()
      .from(workspaceConnections)
      .where(
        and(
          eq(workspaceConnections.workspaceId, workspaceId),
          eq(workspaceConnections.provider, provider),
        ),
      )
    return row
  },

  async listForWorkspace(workspaceId: string): Promise<WorkspaceConnection[]> {
    return db()
      .select()
      .from(workspaceConnections)
      .where(eq(workspaceConnections.workspaceId, workspaceId))
      .orderBy(workspaceConnections.provider)
  },

  async upsert(
    workspaceId: string,
    data: Omit<NewWorkspaceConnection, 'workspaceId' | 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<WorkspaceConnection> {
    const existing = await this.findForWorkspaceAndProvider(workspaceId, data.provider)
    if (existing) {
      const [row] = await db()
        .update(workspaceConnections)
        .set({
          accountLogin: data.accountLogin ?? existing.accountLogin,
          accountName: data.accountName ?? existing.accountName,
          avatarUrl: data.avatarUrl ?? existing.avatarUrl,
          tokenEncrypted: data.tokenEncrypted,
          tokenExpiresAt: data.tokenExpiresAt ?? existing.tokenExpiresAt,
          scopes: data.scopes ?? existing.scopes,
          updatedAt: new Date(),
        })
        .where(eq(workspaceConnections.id, existing.id))
        .returning()
      return row
    }

    const [row] = await db()
      .insert(workspaceConnections)
      .values({
        workspaceId,
        ...data,
        scopes: data.scopes ?? [],
      })
      .returning()
    return row
  },

  async remove(workspaceId: string, provider: ConnectionProvider): Promise<boolean> {
    const [deleted] = await db()
      .delete(workspaceConnections)
      .where(
        and(
          eq(workspaceConnections.workspaceId, workspaceId),
          eq(workspaceConnections.provider, provider),
        ),
      )
      .returning({ id: workspaceConnections.id })
    return deleted !== undefined
  },
}
