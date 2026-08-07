import { getDb } from '@/db/client'
import { projects } from '@/db/schema'
import { eq, and, sql, desc, asc } from 'drizzle-orm'
import type { Project, NewProject } from '@/db/schema'
import type { ProjectStatus } from '@/modules/projects/projects.types'

function db() {
  return getDb()
}

type FindAllOptions = {
  workspaceId: string
  limit: number
  offset: number
  status?: ProjectStatus
  sortBy: 'name' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}

const SORT_COLUMNS = {
  name: projects.name,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
} as const

export const projectRepository = {
  async findAll(opts: FindAllOptions): Promise<{ data: Project[]; total: number }> {
    const conditions = [eq(projects.workspaceId, opts.workspaceId)]
    if (opts.status) {
      conditions.push(eq(projects.status, opts.status))
    }

    const where = and(...conditions)
    const orderFn = opts.sortOrder === 'desc' ? desc : asc

    const data = await db()
      .select()
      .from(projects)
      .where(where)
      .orderBy(orderFn(SORT_COLUMNS[opts.sortBy]))
      .limit(opts.limit)
      .offset(opts.offset)

    const totalResult = await db()
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(where)

    return { data, total: Number(totalResult[0].count) }
  },

  async findById(workspaceId: string, id: string): Promise<Project | undefined> {
    const [row] = await db()
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)))
    return row
  },

  async findByIdGlobal(id: string): Promise<Project | undefined> {
    const [row] = await db().select().from(projects).where(eq(projects.id, id))
    return row
  },

  async create(workspaceId: string, data: Omit<NewProject, 'workspaceId'>): Promise<Project> {
    const [row] = await db().insert(projects).values({ ...data, workspaceId }).returning()
    return row
  },

  async update(workspaceId: string, id: string, data: Partial<NewProject>): Promise<Project | undefined> {
    const [row] = await db()
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)))
      .returning()
    return row
  },

  async updateGlobal(id: string, data: Partial<NewProject>): Promise<Project | undefined> {
    const [row] = await db()
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
    return row
  },

  async delete(workspaceId: string, id: string): Promise<boolean> {
    const [deleted] = await db()
      .delete(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.id, id)))
      .returning({ id: projects.id })
    return deleted !== undefined
  },
}