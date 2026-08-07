import { getDb } from '@/db/client'
import { versions } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { Version, NewVersion, ArtifactType } from '@/db/schema'

function db() {
  return getDb()
}

export const versionRepository = {
  async create(data: Omit<NewVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Version> {
    const [row] = await db().insert(versions).values(data).returning()
    return row
  },

  async latestForProject(
    projectId: string,
    artifactType: ArtifactType,
  ): Promise<Version | undefined> {
    const [row] = await db()
      .select()
      .from(versions)
      .where(and(eq(versions.projectId, projectId), eq(versions.artifactType, artifactType)))
      .orderBy(desc(versions.createdAt))
      .limit(1)
    return row
  },

  async listForProject(projectId: string): Promise<Version[]> {
    return db()
      .select()
      .from(versions)
      .where(eq(versions.projectId, projectId))
      .orderBy(desc(versions.createdAt))
  },

  async findBySandboxId(sandboxId: string): Promise<Version | undefined> {
    const [row] = await db().select().from(versions).where(eq(versions.sandboxId, sandboxId))
    return row
  },
}
