import pkg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { config } from '@/config'
import * as schema from '@/db/schema'

const { Pool } = pkg

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (_db) return _db

  const pool = new Pool({ connectionString: config.databaseUrl })

  _db = drizzle(pool, { schema })
  return _db
}

export type Db = ReturnType<typeof getDb>
