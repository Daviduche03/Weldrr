import { http } from '@/lib/http'

export type ConnectionProvider = 'github' | 'npm' | 'pypi' | 'goproxy' | 'maven' | 'rubygems'

export type ConnectionInfo = {
  provider: ConnectionProvider
  connected: boolean
  accountLogin: string | null
  accountName: string | null
  avatarUrl: string | null
  scopes: string[]
}

export type SaveTokenInput = {
  provider: Exclude<ConnectionProvider, 'github'>
  token: string
  accountLogin?: string
  accountName?: string
}

export const connectionApi = {
  list: (): Promise<ConnectionInfo[]> => http.get<ConnectionInfo[]>('/api/connections'),

  githubAuthUrl: (): Promise<{ url: string }> =>
    http.get<{ url: string }>('/api/connections/github/auth-url'),

  saveToken: (input: SaveTokenInput): Promise<void> =>
    http.post<void>('/api/connections/tokens', input),

  disconnect: (provider: ConnectionProvider): Promise<void> =>
    http.remove<void>(`/api/connections/${provider}`),
}
