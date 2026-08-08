import { create } from 'zustand'
import { authApi, type RegisterInput } from '@/lib/api/auth'
import { clearTokens, getTokens, setTokens } from '@/lib/tokens'
import type { User } from '@/lib/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthState = {
  user: User | null
  status: AuthStatus
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: getTokens() ? 'loading' : 'anonymous',

  initialize: async () => {
    if (!getTokens()) return
    try {
      const me = await authApi.me()
      set({ user: me, status: 'authenticated' })
    } catch {
      clearTokens()
      set({ user: null, status: 'anonymous' })
    }
  },

  login: async (email, password) => {
    const result = await authApi.login(email, password)
    setTokens(result.tokens)
    set({ user: result.user, status: 'authenticated' })
  },

  register: async (input) => {
    const result = await authApi.register(input)
    setTokens(result.tokens)
    set({ user: result.user, status: 'authenticated' })
  },

  signOut: async () => {
    const tokens = getTokens()
    try {
      if (tokens) await authApi.logout(tokens.refreshToken)
    } catch {
      // Best-effort — clear locally regardless.
    }
    clearTokens()
    set({ user: null, status: 'anonymous' })
  },
}))
