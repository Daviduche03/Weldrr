import { ModalClient, Probe, type Sandbox, type Image } from 'modal'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import { imageBuildCommands } from '@/services/sandbox-runtime'
import { logger } from '@/utils/logger'

let client: ModalClient | null = null

export function getModalClient(): ModalClient {
  if (!client) {
    if (!config.modal.tokenId && !config.modal.tokenSecret) {
      logger.info('No Modal token in env; falling back to device config (~/.modal.toml)')
    }
    client = new ModalClient({
      ...(config.modal.tokenId ? { tokenId: config.modal.tokenId } : {}),
      ...(config.modal.tokenSecret ? { tokenSecret: config.modal.tokenSecret } : {}),
      ...(config.modal.environment ? { environment: config.modal.environment } : {}),
    })
  }
  return client
}

async function getOrBuildImage(): Promise<Image> {
  const modal = getModalClient()
  const app = await modal.apps.fromName(config.modal.appName, { createIfMissing: true })

  try {
    const existing = await modal.images.fromName(config.modal.imageName)
    logger.info({ image: config.modal.imageName }, 'Using prebuilt sandbox image')
    return existing
  } catch {
    logger.info({ image: config.modal.imageName }, 'Sandbox image not found; building')
  }

  const image = modal.images.fromRegistry('node:22-slim').dockerfileCommands(imageBuildCommands())
  const built = await image.build(app)
  await built.publish(config.modal.imageName)
  logger.info({ image: config.modal.imageName }, 'Sandbox image built and published')

  return modal.images.fromName(config.modal.imageName)
}

export type SandboxProvisionInput = {
  sandboxId: string
  jobType: 'discovery' | 'sdk' | 'docs'
  callbackUrl: string
  callbackToken: string
  bootstrapUrl: string
  gitTemplate: string
  opencodePassword: string
  discoveryTarget?: string
  gitRemote?: string
  gitToken?: string
  gitBranch?: string
  artifactVersion?: string
}

export type SandboxProvision = {
  sandboxId: string
  tunnelUrl: string
}

export async function provisionSandbox(input: SandboxProvisionInput): Promise<SandboxProvision> {
  const modal = getModalClient()
  const image = await getOrBuildImage()
  const app = await modal.apps.fromName(config.modal.appName, { createIfMissing: true })

  const secret = await modal.secrets.fromObject({
    WELDRR_SANDBOX_ID: input.sandboxId,
    WELDRR_JOB_TYPE: input.jobType,
    WELDRR_CALLBACK_URL: input.callbackUrl,
    WELDRR_CALLBACK_TOKEN: input.callbackToken,
    WELDRR_BOOTSTRAP_URL: input.bootstrapUrl,
    WELDRR_GIT_TEMPLATE: input.gitTemplate,
    WELDRR_OPENCODE_PASSWORD: input.opencodePassword,
    WELDRR_OPENCODE_MODEL: config.sandbox.opencodeModel,
    ...(input.discoveryTarget ? { WELDRR_DISCOVERY_TARGET: input.discoveryTarget } : {}),
    ...(input.gitRemote ? { WELDRR_GIT_REMOTE: input.gitRemote } : {}),
    ...(input.gitToken ? { WELDRR_GIT_TOKEN: input.gitToken } : {}),
    ...(input.gitBranch ? { WELDRR_GIT_BRANCH: input.gitBranch } : {}),
    ...(input.artifactVersion ? { WELDRR_ARTIFACT_VERSION: input.artifactVersion } : {}),
  })

  const sandbox = await modal.sandboxes.create(app, image, {
    name: `weldrr-${input.sandboxId}`,
    command: ['bash', '/opt/weldrr/startup.sh'],
    encryptedPorts: [config.sandbox.opencodePort],
    timeoutMs: config.sandbox.timeoutMs,
    // Agents work *inside* the opencode web process, which Modal does not count
    // as "active" for idle detection. Idle-killing would silently terminate a
    // working agent, so scope the lifetime to the hard timeout instead and rely
    // on explicit termination (callback / terminate endpoint).
    idleTimeoutMs: config.sandbox.timeoutMs,
    readinessProbe: Probe.withTcp(config.sandbox.opencodePort, { intervalMs: 1000 }),
    secrets: [secret],
    tags: { 'weldrr-sandbox-id': input.sandboxId, 'weldrr-job-type': input.jobType },
  })

  logger.info({ sandboxId: input.sandboxId, modalId: sandbox.sandboxId }, 'Sandbox created on Modal')

  try {
    await sandbox.waitUntilReady(5 * 60 * 1000)
  } catch (err) {
    await sandbox.terminate()
    throw new AppError(
      502,
      `Sandbox failed to become ready: ${err instanceof Error ? err.message : 'unknown error'}`,
    )
  }

  const tunnels = await sandbox.tunnels()
  const tunnel = tunnels[config.sandbox.opencodePort]
  if (!tunnel) {
    await sandbox.terminate()
    throw new AppError(502, `No tunnel available for port ${config.sandbox.opencodePort}`)
  }

  const tunnelUrl = tunnel.url
  sandbox.detach()
  logger.info({ sandboxId: input.sandboxId, tunnelUrl }, 'Sandbox ready')

  return { sandboxId: sandbox.sandboxId, tunnelUrl }
}

export async function terminateModalSandbox(modalSandboxId: string): Promise<void> {
  if (!modalSandboxId) return
  const modal = getModalClient()
  const sandbox = await modal.sandboxes.fromId(modalSandboxId)
  await sandbox.terminate()
}

export async function sandboxState(modalSandboxId: string): Promise<number | null> {
  const modal = getModalClient()
  const sandbox: Sandbox = await modal.sandboxes.fromId(modalSandboxId)
  return sandbox.poll()
}

export async function readSandboxFile(
  modalSandboxId: string,
  filePath: string,
): Promise<string> {
  const modal = getModalClient()
  const sandbox = await modal.sandboxes.fromId(modalSandboxId)
  const proc = await sandbox.exec(['cat', filePath])
  const stdout = await proc.stdout.readText()
  const stderr = await proc.stderr.readText()
  if (!stdout && stderr) {
    throw new AppError(502, `Failed to read sandbox file: ${stderr.slice(0, 200)}`)
  }
  return stdout
}
