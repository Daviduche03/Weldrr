import { getDb } from '@/db/client'
import { sandboxes } from '@/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import type { Sandbox, NewSandbox, SandboxJobType } from '@/db/schema'
import type { SandboxStatus } from '@/modules/sandboxes/sandboxes.types'

function db() {
  return getDb()
}

type FindAllOptions = {
  workspaceId: string
  limit: number
  offset: number
  jobType?: SandboxJobType
  status?: SandboxStatus
  projectId?: string
  sortOrder: 'asc' | 'desc'
}

export const sandboxRepository = {
  async findAll(opts: FindAllOptions): Promise<{ data: Sandbox[]; total: number }> {
    const conditions = [eq(sandboxes.workspaceId, opts.workspaceId)]
    if (opts.jobType) conditions.push(eq(sandboxes.jobType, opts.jobType))
    if (opts.status) conditions.push(eq(sandboxes.status, opts.status))
    if (opts.projectId) conditions.push(eq(sandboxes.projectId, opts.projectId))

    const where = and(...conditions)
    const orderFn = opts.sortOrder === 'desc' ? desc : asc

    const data = await db()
      .select()
      .from(sandboxes)
      .where(where)
      .orderBy(orderFn(sandboxes.createdAt))
      .limit(opts.limit)
      .offset(opts.offset)

    const totalResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(sandboxes)
      .where(where)

    return { data, total: Number(totalResult[0].count) }
  },

  async findById(workspaceId: string, id: string): Promise<Sandbox | undefined> {
    const [row] = await db()
      .select()
      .from(sandboxes)
      .where(and(eq(sandboxes.workspaceId, workspaceId), eq(sandboxes.id, id)))
    return row
  },

  async findByIdGlobal(id: string): Promise<Sandbox | undefined> {
    const [row] = await db().select().from(sandboxes).where(eq(sandboxes.id, id))
    return row
  },

  async create(data: Omit<NewSandbox, 'id' | 'createdAt' | 'updatedAt'>): Promise<Sandbox> {
    const [row] = await db().insert(sandboxes).values(data).returning()
    return row
  },

  async update(
    workspaceId: string,
    id: string,
    data: Partial<NewSandbox>,
  ): Promise<Sandbox | undefined> {
    const [row] = await db()
      .update(sandboxes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(sandboxes.workspaceId, workspaceId), eq(sandboxes.id, id)))
      .returning()
    return row
  },

  async updateGlobal(id: string, data: Partial<NewSandbox>): Promise<Sandbox | undefined> {
    const [row] = await db()
      .update(sandboxes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sandboxes.id, id))
      .returning()
    return row
  },

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const [deleted] = await db()
      .delete(sandboxes)
      .where(and(eq(sandboxes.workspaceId, workspaceId), eq(sandboxes.id, id)))
      .returning({ id: sandboxes.id })
    return deleted !== undefined
  },
}
