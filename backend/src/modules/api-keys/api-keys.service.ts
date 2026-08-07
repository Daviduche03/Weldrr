import crypto from 'node:crypto'
import { apiKeyRepository } from '@/modules/api-keys/api-keys.repository'
import { activityService } from '@/modules/activity/activity.service'
import { NotFoundError } from '@/middleware/errorHandler'
import type {
  ApiKeyResponse,
  CreateApiKeyInput,
  CreateApiKeyResult,
} from '@/modules/api-keys/api-keys.types'
import type { ApiKey } from '@/db/schema'

const KEY_PREFIX = 'wr_'

function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

function generateSecret(): { secret: string; prefix: string; secretHash: string } {
  const secret = `${KEY_PREFIX}${crypto.randomBytes(24).toString('base64url')}`
  return {
    secret,
    prefix: secret.slice(0, 10),
    secretHash: hashSecret(secret),
  }
}

function toResponse(key: ApiKey): ApiKeyResponse {
  return {
    id: key.id,
    name: key.name,
    prefix: key.prefix,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
  }
}

export const apiKeyService = {
  async list(workspaceId: string): Promise<ApiKeyResponse[]> {
    const keys = await apiKeyRepository.listActive(workspaceId)
    return keys.map(toResponse)
  },

  async create(workspaceId: string, input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const { secret, prefix, secretHash } = generateSecret()
    const key = await apiKeyRepository.create(workspaceId, {
      name: input.name,
      prefix,
      secretHash,
    })

    await activityService.record({
      workspaceId,
      projectId: null,
      projectName: input.name,
      action: 'api_key_created',
      detail: `API key "${input.name}" created`,
    })

    return { ...toResponse(key), secret }
  },

  async revoke(workspaceId: string, id: string): Promise<void> {
    const existing = await apiKeyRepository.findById(workspaceId, id)
    if (!existing) throw new NotFoundError('API key not found')

    const revoked = await apiKeyRepository.revoke(workspaceId, id)
    if (!revoked) throw new NotFoundError('API key not found')

    await activityService.record({
      workspaceId,
      projectId: null,
      projectName: existing.name,
      action: 'api_key_revoked',
      detail: `API key "${existing.name}" revoked`,
    })
  },
}