import { getDb } from '@/db/client'
import { oauthAccounts, workspaceMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { OAuthAccount } from '@/db/schema'

function db() {
  return getDb()
}

export type GithubConnection = OAuthAccount & { login: string }

export const githubRepository = {
  async findByUserId(userId: string): Promise<OAuthAccount | undefined> {
    const [row] = await db()
      .select()
      .from(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, 'github'), eq(oauthAccounts.userId, userId)))
    return row
  },

  /** Finds a GitHub connection for any member of the workspace (owner first). */
  async findForWorkspace(workspaceId: string): Promise<OAuthAccount | undefined> {
    const rows = await db()
      .select({ account: oauthAccounts })
      .from(workspaceMembers)
      .innerJoin(
        oauthAccounts,
        and(
          eq(oauthAccounts.userId, workspaceMembers.userId),
          eq(oauthAccounts.provider, 'github'),
        ),
      )
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(workspaceMembers.role)

    const first = rows[0]
    return first?.account
  },

  async upsert(
    userId: string,
    data: {
      providerId: string
      accessToken: string
      scopes: string[]
    },
  ): Promise<OAuthAccount> {
    const existing = await this.findByUserId(userId)
    if (existing) {
      const [row] = await db()
        .update(oauthAccounts)
        .set({
          providerId: data.providerId,
          accessToken: data.accessToken,
          scopes: data.scopes,
          tokenExpiresAt: null,
        })
        .where(eq(oauthAccounts.id, existing.id))
        .returning()
      return row
    }

    const [row] = await db()
      .insert(oauthAccounts)
      .values({
        userId,
        provider: 'github',
        providerId: data.providerId,
        accessToken: data.accessToken,
        scopes: data.scopes,
      })
      .returning()
    return row
  },

  async removeByUserId(userId: string): Promise<boolean> {
    const [deleted] = await db()
      .delete(oauthAccounts)
      .where(and(eq(oauthAccounts.provider, 'github'), eq(oauthAccounts.userId, userId)))
      .returning({ id: oauthAccounts.id })
    return deleted !== undefined
  },
}
