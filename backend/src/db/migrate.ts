import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getDb } from '@/db/client'

export async function runMigrations(): Promise<void> {
  await migrate(getDb(), { migrationsFolder: './src/db/migrations' })
}