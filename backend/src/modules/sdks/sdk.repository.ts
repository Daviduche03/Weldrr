import { getDb } from '@/config/database'
import { sdks } from '@/modules/sdks/sdk.schema'
import { eq, and, sql, desc, asc } from 'drizzle-orm'
import type { NewSdk, Sdk } from '@/modules/sdks/sdk.schema'

function db() {
  return getDb()
}

export const sdkRepository = {
  async findAll(opts: {
    userId: string
    limit: number
    offset: number
    status?: string
    language?: string
    sortBy: string
    sortOrder: string
  }): Promise<{ data: Sdk[]; total: number }> {
    const conditions: any[] = [eq(sdks.userId, opts.userId)]

    if (opts.status) conditions.push(eq(sdks.status, opts.status as any))
    if (opts.language) conditions.push(eq(sdks.language, opts.language as any))

    const where = and(...conditions)

    const orderByFn = opts.sortOrder === 'desc' ? desc : asc
    const sortColumn =
      opts.sortBy === 'name' ? sdks.name : opts.sortBy === 'updatedAt' ? sdks.updatedAt : sdks.createdAt

    const rows = await db()
      .select()
      .from(sdks)
      .where(where)
      .orderBy(orderByFn(sortColumn))
      .limit(opts.limit)
      .offset(opts.offset)

    const totalResult = await db()
      .select({ count: sql<number>`COUNT(*)` })
      .from(sdks)
      .where(where)

    return { data: rows, total: totalResult[0].count }
  },

  async findById(id: string): Promise<Sdk | undefined> {
    const rows = await db().select().from(sdks).where(eq(sdks.id, id))
    return rows[0]
  },

  async create(userId: string, data: NewSdk): Promise<Sdk> {
    const [row] = await db().insert(sdks).values({ ...data, userId }).returning()
    return row
  },

  async update(id: string, data: Partial<NewSdk>): Promise<Sdk | undefined> {
    const [row] = await db()
      .update(sdks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sdks.id, id))
      .returning()
    return row
  },

  async delete(id: string): Promise<boolean> {
    const result = await db().delete(sdks).where(eq(sdks.id, id))
    return (result as any).rowCount > 0
  },
}
