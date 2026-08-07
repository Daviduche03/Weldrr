import { http } from '@/lib/http'
import type { GitHubConnection, GitHubRepo } from '@/lib/types'

export const githubApi = {
  authUrl: (): Promise<{ url: string }> => http.get<{ url: string }>('/api/github/auth-url'),

  status: (): Promise<GitHubConnection> => http.get<GitHubConnection>('/api/github/status'),

  listRepos: (query?: string): Promise<GitHubRepo[]> =>
    http.get<GitHubRepo[]>('/api/github/repos', {
      query: query ? { query } : undefined,
    }),

  disconnect: (): Promise<void> => http.remove<void>('/api/github/connection'),
}
