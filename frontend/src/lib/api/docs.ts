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

export type BrandingConfig = {
  siteName?: string
  font?: string
  colors?: { primary?: string; accent?: string }
  logo?: string
  favicon?: string
  ogImage?: string
}

export type BrandingAsset = {
  path: string
  base64: string
}

export type DocsWriteResult = {
  path: string
  mode?: 'automerge' | 'pr'
  prNumber?: number
  prUrl?: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type DocsChatResult = {
  reply: string
}

export const docsApi = {
  tree: (projectId: string): Promise<DocsTreeNode[]> =>
    http.get<DocsTreeNode[]>(`/api/projects/${projectId}/docs/tree`),

  readFile: (projectId: string, path: string): Promise<DocsFile> =>
    http.get<DocsFile>(`/api/projects/${projectId}/docs/file`, { query: { path } }),

  writeFile: (projectId: string, path: string, content: string): Promise<DocsWriteResult> =>
    http.put<DocsWriteResult>(`/api/projects/${projectId}/docs/file`, { path, content }),

  deleteFile: (projectId: string, path: string): Promise<void> =>
    http.remove<void>(`/api/projects/${projectId}/docs/file`, { query: { path } }),

  publish: (projectId: string): Promise<DocsPublishResult> =>
    http.post<DocsPublishResult>(`/api/projects/${projectId}/docs/publish`),

  readBranding: (projectId: string): Promise<BrandingConfig> =>
    http.get<BrandingConfig>(`/api/projects/${projectId}/docs/branding`),

  writeBranding: (
    projectId: string,
    config: BrandingConfig,
    assets?: BrandingAsset[],
  ): Promise<{ path: string }> =>
    http.put<{ path: string }>(`/api/projects/${projectId}/docs/branding`, { config, assets }),

  chat: (
    projectId: string,
    body: { messages: ChatMessage[]; file?: string; content?: string },
  ): Promise<DocsChatResult> =>
    http.post<DocsChatResult>(`/api/projects/${projectId}/docs/chat`, body),
}
