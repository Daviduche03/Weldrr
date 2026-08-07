import { http } from '@/lib/http'
import type { Sandbox, SandboxJobType, SandboxStatus } from '@/lib/types'

export type IssueSandboxInput = {
  projectId?: string
  jobType: SandboxJobType
  language?: string
}

export const sandboxApi = {
  issue: (input: IssueSandboxInput): Promise<Sandbox> => http.post<Sandbox>('/api/sandboxes', input),

  list: (params?: { projectId?: string; status?: SandboxStatus; jobType?: SandboxJobType }): Promise<Sandbox[]> =>
    http.get<Sandbox[]>('/api/sandboxes', {
      query: { limit: 100, ...(params?.projectId ? { projectId: params.projectId } : {}), ...(params?.status ? { status: params.status } : {}), ...(params?.jobType ? { jobType: params.jobType } : {}) },
    }),

  get: (id: string): Promise<Sandbox> => http.get<Sandbox>(`/api/sandboxes/${id}`),

  start: (id: string, prompt: string): Promise<{ sessionId: string; tunnelUrl: string }> =>
    http.post<{ sessionId: string; tunnelUrl: string }>(`/api/sandboxes/${id}/start`, { prompt }),

  terminate: (id: string): Promise<Sandbox> => http.post<Sandbox>(`/api/sandboxes/${id}/terminate`),
}
