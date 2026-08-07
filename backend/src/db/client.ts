import pkg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { config } from '@/config'
import * as schema from '@/db/schema'

const { Pool } = pkg

let _pool: InstanceType<typeof Pool> | null = null
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getPool(): InstanceType<typeof Pool> {
  if (!_pool) {
    _pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30_000,
    })
  }
  return _pool
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    _db = drizzle(getPool(), { schema })
  }
  return _db
}

export type Db = ReturnType<typeof getDb>

export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end()
    _pool = null
    _db = null
  }
}
