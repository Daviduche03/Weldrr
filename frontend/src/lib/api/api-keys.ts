import { http } from '@/lib/http'
import type { ApiKey } from '@/lib/types'

export type CreatedApiKey = ApiKey & { secret: string }

export const apiKeyApi = {
  list: (): Promise<ApiKey[]> => http.get<ApiKey[]>('/api/api-keys'),

  create: (name: string): Promise<CreatedApiKey> =>
    http.post<CreatedApiKey>('/api/api-keys', { name }),

  revoke: (id: string): Promise<void> => http.remove<void>(`/api/api-keys/${id}`),
}