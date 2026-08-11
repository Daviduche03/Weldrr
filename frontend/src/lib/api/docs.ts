import { http } from '@/lib/http'
import { getTokens } from '@/lib/tokens'

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

export type ChatStreamOptions = {
  projectId: string
  messages: ChatMessage[]
  file?: string
  content?: string
  onDelta: (full: string) => void
  signal?: AbortSignal
}

export async function chatStream(options: ChatStreamOptions): Promise<void> {
  const { projectId, messages, file, content, onDelta, signal } = options
  const tokens = getTokens()

  const res = await fetch(`${http.url}/api/projects/${projectId}/docs/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    },
    body: JSON.stringify({ messages, file, content }),
    signal,
  })

  if (!res.ok || !res.body) {
    let message = `Request failed with status ${res.status}`
    try {
      const json = (await res.json()) as { message?: string; issues?: unknown }
      if (typeof json.message === 'string' && json.message) message = json.message
    } catch {
      // fall back to the default message
    }
    throw new Error(message)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let acc = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      acc += decoder.decode(value, { stream: true })
      onDelta(acc)
    }
  } finally {
    reader.releaseLock()
  }
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
}
