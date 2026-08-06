import bcrypt from 'bcrypt'
import { getDb } from '@/config/database'
import { users } from '@/modules/auth/auth.schema'
import { sdks } from '@/modules/sdks/sdk.schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/utils/logger'

const sdkData = [
  {
    name: 'Payments API Client',
    description: 'TypeScript client generated from the Payments OpenAPI spec',
    language: 'typescript' as const,
    framework: 'axios',
    status: 'ready' as const,
    spec: {
      openapi: '3.0.0',
      info: { title: 'Payments API', version: '1.0.0' },
      paths: { '/payments': { get: { responses: { '200': { description: 'ok' } } } } },
    },
  },
  {
    name: 'Analytics Python SDK',
    description: 'Python SDK for the Analytics events API',
    language: 'python' as const,
    framework: 'httpx',
    status: 'draft' as const,
    spec: {
      openapi: '3.0.0',
      info: { title: 'Analytics API', version: '2.1.0' },
      paths: {},
    },
  },
]

async function seedUser(): Promise<string> {
  const db = getDb()
  const existing = await db.select().from(users).where(eq(users.email, 'admin@weldrr.app'))
  if (existing.length > 0) return existing[0].id

  const passwordHash = await bcrypt.hash('admin123', 12)
  const [user] = await db
    .insert(users)
    .values({
      email: 'admin@weldrr.app',
      name: 'Weldrr Admin',
      accountType: 'team',
      passwordHash,
      isEmailVerified: true,
    })
    .returning()
  return user.id
}

async function seedSdks(userId: string) {
  const db = getDb()
  const existing = await db.select({ id: sdks.id }).from(sdks).limit(1)
  if (existing.length > 0) {
    logger.info('SDKs already seeded, skipping')
    return
  }

  await db.insert(sdks).values(sdkData.map((s) => ({ ...s, userId })))
  logger.info(`Seeded ${sdkData.length} SDKs`)
}

export async function seedAll() {
  const userId = await seedUser()
  await seedSdks(userId)
}
