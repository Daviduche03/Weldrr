import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, type RegisterInput } from '@/lib/api/auth'
import { clearTokens, getTokens, setTokens } from '@/lib/tokens'
import type { User } from '@/lib/types'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

type AuthState = {
  user: User | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (getTokens() ? 'loading' : 'anonymous'))

  useEffect(() => {
    if (!getTokens()) return
    let active = true
    authApi
      .me()
      .then((me) => {
        if (active) {
          setUser(me)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (active) {
          clearTokens()
          setUser(null)
          setStatus('anonymous')
        }
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password)
    setTokens(result.tokens)
    setUser(result.user)
    setStatus('authenticated')
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authApi.register(input)
    setTokens(result.tokens)
    setUser(result.user)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    const tokens = getTokens()
    try {
      if (tokens) await authApi.logout(tokens.refreshToken)
    } catch {
      // Best-effort — clear locally regardless.
    }
    clearTokens()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(
    () => ({ user, status, login, register, signOut }),
    [user, status, login, register, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
