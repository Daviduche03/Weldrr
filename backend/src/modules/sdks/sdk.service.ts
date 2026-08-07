import { sdkRepository } from '@/modules/sdks/sdk.repository'
import { projectRepository } from '@/modules/projects/projects.repository'
import { activityService } from '@/modules/activity/activity.service'
import { NotFoundError } from '@/middleware/errorHandler'
import type { SdkResponse, CreateSdkInput, UpdateSdkInput } from '@/modules/sdks/sdk.types'
import type { SdkRow } from '@/db/schema'

function toResponse(sdk: SdkRow): SdkResponse {
  return {
    id: sdk.id,
    projectId: sdk.projectId,
    name: sdk.name,
    language: sdk.language,
    status: sdk.status,
    createdAt: sdk.createdAt,
    updatedAt: sdk.updatedAt,
  }
}

async function assertProjectInWorkspace(workspaceId: string, projectId: string): Promise<void> {
  const project = await projectRepository.findById(workspaceId, projectId)
  if (!project) throw new NotFoundError('Project not found')
}

export const sdkService = {
  async list(workspaceId: string, projectId: string): Promise<SdkResponse[]> {
    await assertProjectInWorkspace(workspaceId, projectId)
    const rows = await sdkRepository.listForProject(workspaceId, projectId)
    return rows.map(toResponse)
  },

  async create(workspaceId: string, projectId: string, input: CreateSdkInput): Promise<SdkResponse> {
    await assertProjectInWorkspace(workspaceId, projectId)

    const sdk = await sdkRepository.create(workspaceId, projectId, {
      name: input.name,
      language: input.language ?? 'typescript',
      spec: input.spec ?? null,
      status: 'generating',
    })

    await activityService.record({
      workspaceId,
      projectId,
      projectName: sdk.name,
      action: 'generated',
      detail: `Started generating ${sdk.language} SDK "${sdk.name}"`,
    })

    return toResponse(sdk)
  },

  async update(
    workspaceId: string,
    projectId: string,
    id: string,
    input: UpdateSdkInput,
  ): Promise<SdkResponse> {
    await assertProjectInWorkspace(workspaceId, projectId)

    const existing = await sdkRepository.findById(workspaceId, id)
    if (!existing || existing.projectId !== projectId) throw new NotFoundError('SDK not found')

    const sdk = await sdkRepository.update(workspaceId, id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    })
    if (!sdk) throw new NotFoundError('SDK not found')

    return toResponse(sdk)
  },

  async delete(workspaceId: string, projectId: string, id: string): Promise<void> {
    await assertProjectInWorkspace(workspaceId, projectId)

    const existing = await sdkRepository.findById(workspaceId, id)
    if (!existing || existing.projectId !== projectId) throw new NotFoundError('SDK not found')

    await sdkRepository.delete(workspaceId, id)
  },
}