import { config } from '@/config'
import { getModalClient } from '@/services/modal'
import { imageBuildCommands } from '@/services/sandbox-runtime'
import { logger } from '@/utils/logger'

async function main(): Promise<void> {
  const force = process.argv.includes('--force')
  const modal = getModalClient()
  const app = await modal.apps.fromName(config.modal.appName, { createIfMissing: true })

  if (!force) {
    try {
      await modal.images.fromName(config.modal.imageName)
      logger.info({ image: config.modal.imageName }, 'Sandbox image already exists — use --force to rebuild')
      return
    } catch {
      logger.info({ image: config.modal.imageName }, 'Sandbox image not found — building')
    }
  } else {
    logger.info({ image: config.modal.imageName }, 'Forced rebuild requested')
  }

  const image = modal.images.fromRegistry('node:22-slim').dockerfileCommands(imageBuildCommands())
  const built = await image.build(app)
  await built.publish(config.modal.imageName)
  logger.info({ image: config.modal.imageName }, 'Sandbox image built and published')
}

main().catch((err) => {
  logger.error({ err }, 'Failed to build sandbox image')
  process.exit(1)
})
