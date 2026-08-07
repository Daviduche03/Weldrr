import type { Sandbox, SandboxJobType, SandboxLanguage, SandboxStatus } from '@/db/schema'
import { decryptSecret } from '@/shared/utils/credential-cipher'

export type { SandboxJobType, SandboxLanguage, SandboxStatus }

export type SandboxResponse = {
  id: string
  workspaceId: string
  projectId: string | null
  jobType: SandboxJobType
  language: SandboxLanguage | null
  status: SandboxStatus
  modalSandboxId: string | null
  tunnelUrl: string | null
  opencodePassword: string | null
  artifactUrl: string | null
  version: string | null
  error: string | null
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreateSandboxInput = {
  projectId?: string
  jobType: SandboxJobType
  language?: SandboxLanguage
  spec?: Record<string, unknown>
}

export type SandboxQuery = {
  page: number
  limit: number
  jobType?: SandboxJobType
  status?: SandboxStatus
  projectId?: string
}

export type CallbackInput = {
  sandboxId: string
  token: string
  status: 'finished' | 'failed'
  artifactUrl?: string
  summary?: string
}

export type StartSandboxInput = {
  prompt: string
}

export function toSandboxResponse(row: Sandbox): SandboxResponse {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    jobType: row.jobType,
    language: row.language,
    status: row.status,
    modalSandboxId: row.modalSandboxId,
    tunnelUrl: row.tunnelUrl,
    opencodePassword: row.opencodePassword
      ? decryptSecret(row.opencodePassword)
      : null,
    artifactUrl: row.artifactUrl,
    version: row.version,
    error: row.error,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
