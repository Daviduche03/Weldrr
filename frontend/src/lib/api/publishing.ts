import { http } from '@/lib/http'

export type PublishKind = 'docs' | 'sdk'

export type MergeResult = {
  merged: boolean
  version?: string
}

export const publishingApi = {
  merge: (projectId: string, prNumber: number, kind: PublishKind): Promise<MergeResult> =>
    http.post<MergeResult>(`/api/projects/${projectId}/publish/merge`, { prNumber, kind }),

  watch: (projectId: string, prNumber: number, kind: PublishKind): Promise<void> =>
    http.post<void>(`/api/projects/${projectId}/publish/watch`, { prNumber, kind }),
}
