import { http } from '@/lib/http'
import type { CreateProjectInput, Discovery, Project, ProjectStatus } from '@/lib/types'

export type UpdateProjectInput = Partial<CreateProjectInput> & {
  status?: ProjectStatus
  docsUrl?: string
  sdkLanguages?: string[]
  cliEnabled?: boolean
}

export const projectApi = {
  list: (status?: ProjectStatus): Promise<Project[]> =>
    http.get<Project[]>('/api/projects', {
      query: { limit: 100, sortBy: 'updatedAt', sortOrder: 'desc', ...(status ? { status } : {}) },
    }),

  get: (id: string): Promise<Project> => http.get<Project>(`/api/projects/${id}`),

  create: (input: CreateProjectInput): Promise<Project> =>
    http.post<Project>('/api/projects', input),

  update: (id: string, input: UpdateProjectInput): Promise<Project> =>
    http.patch<Project>(`/api/projects/${id}`, input),

  discovery: (id: string): Promise<Discovery> =>
    http.get<Discovery>(`/api/projects/${id}/discovery`),

  rerunDiscovery: (id: string): Promise<void> =>
    http.post<void>(`/api/projects/${id}/discovery`),

  remove: (id: string): Promise<void> => http.remove<void>(`/api/projects/${id}`),
}
