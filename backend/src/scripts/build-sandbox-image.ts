import { config } from '@/config'
import { getModalClient } from '@/services/modal'
import { imageBuildCommands } from '@/services/sandbox-runtime'
import { logger } from '@/utils/logger'

async function main(): Promise<void> {
  const modal = getModalClient()
  const app = await modal.apps.fromName(config.modal.appName, { createIfMissing: true })

  try {
    await modal.images.fromName(config.modal.imageName)
    logger.info({ image: config.modal.imageName }, 'Sandbox image already exists — skipping build')
    return
  } catch {
    logger.info({ image: config.modal.imageName }, 'Sandbox image not found — building')
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
