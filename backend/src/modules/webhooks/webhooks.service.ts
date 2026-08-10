import crypto from 'node:crypto'
import { getDb } from '@/db/client'
import { projects } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import { projectRepository } from '@/modules/projects/projects.repository'
import { connectionService } from '@/modules/connections/connections.service'
import { registerWebhook, getRepoHeadSha } from '@/services/github'
import { issueDiscoverySandbox } from '@/modules/sandboxes/sandboxes.service'
import { logger } from '@/utils/logger'

function randomSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

function webhookUrl(): string {
  return `${config.webhookUrl}/api/webhooks/github`
}

export type PushEvent = {
  ref?: string
  after?: string
  repository?: { full_name?: string; default_branch?: string }
}

export const webhookService = {
  /**
   * Registers a GitHub push webhook for a project (source repo) and stores the
   * per-project HMAC secret. Idempotent-ish: creates the webhook via the API.
   */
  async registerForProject(projectId: string): Promise<void> {
    const project = await projectRepository.findByIdGlobal(projectId)
    if (!project?.gitRepo) return

    const connection = await connectionService.getConnection(project.workspaceId, 'github')
    if (!connection?.token) {
      logger.warn({ projectId }, 'No GitHub connection — cannot register webhook')
      return
    }

    const secret = project.webhookSecret || randomSecret()
    await registerWebhook(connection.token, project.gitRepo.fullName, {
      url: webhookUrl(),
      secret,
    })

    // Baseline the analyzed SHA to the current HEAD so the first future push
    // is detected as a change.
    let headSha: string | null = project.specCommitSha
    if (!headSha) {
      try {
        headSha = await getRepoHeadSha(
          connection.token,
          project.gitRepo.fullName,
          project.gitRepo.defaultBranch,
        )
      } catch {
        headSha = null
      }
    }

    await getDb()
      .update(projects)
      .set({ webhookSecret: secret, specCommitSha: headSha })
      .where(eq(projects.id, project.id))
    logger.info({ projectId, repo: project.gitRepo.fullName }, 'GitHub push webhook registered')
  },

  /**
   * Handles a GitHub push webhook delivery. Verifies the HMAC signature, then,
   * if the pushed commit differs from the last analyzed one, re-runs discovery
   * (which auto-chains SDK + docs).
   */
  async handlePush(body: string, signature: string | undefined): Promise<{ regenerated: boolean }> {
    const payload = JSON.parse(body) as PushEvent
    const fullName = payload.repository?.full_name
    const newSha = payload.after
    if (!fullName || !newSha) {
      throw new AppError(400, 'Malformed push event')
    }

    const [project] = await getDb()
      .select()
      .from(projects)
      .where(sql`${projects.gitRepo}->>'fullName' = ${fullName}`)
    if (!project?.webhookSecret) {
      // No webhook registered for this repo — nothing to reconcile.
      return { regenerated: false }
    }

    if (!verifySignature(body, signature, project.webhookSecret)) {
      throw new AppError(401, 'Invalid webhook signature')
    }

    if (project.specCommitSha === newSha) {
      logger.info({ projectId: project.id, sha: newSha }, 'Push matches last analyzed commit — skipping')
      return { regenerated: false }
    }

    // Update the analyzed SHA and re-run discovery (chains SDK + docs).
    await getDb()
      .update(projects)
      .set({ specCommitSha: newSha, status: 'generating' })
      .where(eq(projects.id, project.id))

    void issueDiscoverySandbox(project.id)
    logger.info({ projectId: project.id, sha: newSha }, 'Repo changed — re-running discovery')
    return { regenerated: true }
  },
}

function verifySignature(body: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`
  const [algo, provided] = signature.split('=')
  if (algo !== 'sha256' || !provided) return false
  const a = Buffer.from(expected.split('=')[1] ?? '', 'hex')
  const b = Buffer.from(provided, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}