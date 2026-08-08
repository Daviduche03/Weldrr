import { http } from '@/lib/http'
import type { Sdk, SdkLanguage } from '@/lib/types'

export type CreateSdkInput = {
  name: string
  language?: SdkLanguage
}

export type SdkTreeNode = {
  path: string
  name: string
  type: 'tree' | 'blob'
  kind: string
  sha: string
}

export type SdkFile = {
  path: string
  content: string
  kind: string
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

  tree: (projectId: string, language: SdkLanguage): Promise<SdkTreeNode[]> =>
    http.get<SdkTreeNode[]>(`/api/projects/${projectId}/sdks/${language}/tree`),

  readFile: (projectId: string, language: SdkLanguage, path: string): Promise<SdkFile> =>
    http.get<SdkFile>(`/api/projects/${projectId}/sdks/${language}/file`, { query: { path } }),
}
