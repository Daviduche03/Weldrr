import type { Server } from 'node:http'
import { config } from '@/config'
import { createApp } from '@/app'
import { getPool, closePool } from '@/db/client'
import { runMigrations } from '@/db/migrate'
import { seedAll } from '@/db/seed'
import { logger } from '@/utils/logger'

async function bootstrap(): Promise<void> {
  const pool = getPool()

  await pool.query('SELECT 1')
  logger.info('Database connection established')

  await runMigrations()
  logger.info('Migrations applied')

  await seedAll()

  const app = createApp()
  const server: Server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} (${config.nodeEnv})`)
  })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal} — shutting down gracefully`)
    server.close(async () => {
      await closePool()
      process.exit(0)
    })
    setTimeout(() => {
      logger.warn('Forced shutdown after timeout')
      process.exit(1)
    }, 10_000).unref()
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection')
  })
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception')
    process.exit(1)
  })
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server')
  process.exit(1)
})

export { createApp }