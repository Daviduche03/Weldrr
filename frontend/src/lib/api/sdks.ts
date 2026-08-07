import { http } from '@/lib/http'
import type { Sdk, SdkLanguage } from '@/lib/types'

export type CreateSdkInput = {
  name: string
  language?: SdkLanguage
}

export const sdkApi = {
  list: (projectId: string): Promise<Sdk[]> =>
    http.get<Sdk[]>(`/api/projects/${projectId}/sdks`),

  create: (projectId: string, input: CreateSdkInput): Promise<Sdk> =>
    http.post<Sdk>(`/api/projects/${projectId}/sdks`, input),

  update: (projectId: string, id: string, input: Partial<CreateSdkInput>): Promise<Sdk> =>
    http.patch<Sdk>(`/api/projects/${projectId}/sdks/${id}`, input),

  remove: (projectId: string, id: string): Promise<void> =>
    http.remove<void>(`/api/projects/${projectId}/sdks/${id}`),
}
