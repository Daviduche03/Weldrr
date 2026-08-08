import { http } from '@/lib/http'

export type DocsTreeNode = {
  path: string
  name: string
  type: 'tree' | 'blob'
  editable: boolean
  kind: string
  sha: string
}

export type DocsFile = {
  path: string
  content: string
  kind: string
}

export type DocsPublishResult = {
  version: string
}

export const docsApi = {
  tree: (projectId: string): Promise<DocsTreeNode[]> =>
    http.get<DocsTreeNode[]>(`/api/projects/${projectId}/docs/tree`),

  readFile: (projectId: string, path: string): Promise<DocsFile> =>
    http.get<DocsFile>(`/api/projects/${projectId}/docs/file`, { query: { path } }),

  writeFile: (projectId: string, path: string, content: string): Promise<{ path: string }> =>
    http.put<{ path: string }>(`/api/projects/${projectId}/docs/file`, { path, content }),

  deleteFile: (projectId: string, path: string): Promise<void> =>
    http.remove<void>(`/api/projects/${projectId}/docs/file`, { query: { path } }),

  publish: (projectId: string): Promise<DocsPublishResult> =>
    http.post<DocsPublishResult>(`/api/projects/${projectId}/docs/publish`),
}
