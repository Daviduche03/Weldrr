import { http } from '@/lib/http'
import type { LoginResult, User } from '@/lib/types'

export type RegisterInput = {
  email: string
  password: string
  name: string
  accountType: 'developer' | 'team'
  company?: string
}

export const authApi = {
  login: (email: string, password: string): Promise<LoginResult> =>
    http.post<LoginResult>('/api/auth/login', { email, password }),

  register: (input: RegisterInput): Promise<LoginResult> =>
    http.post<LoginResult>('/api/auth/register', input),

  me: (): Promise<User> => http.get<User>('/api/auth/me'),

  updateProfile: (input: {
    name?: string
    accountType?: 'developer' | 'team'
    company?: string
  }): Promise<User> => http.patch<User>('/api/auth/me', input),

  logout: (refreshToken: string): Promise<void> =>
    http.post<void>('/api/auth/logout', { refreshToken }, { auth: false }),
}
