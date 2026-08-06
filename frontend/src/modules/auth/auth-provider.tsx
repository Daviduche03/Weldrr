import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type User = {
  email: string
  name: string
  provider: 'github' | 'google'
}

type AuthState = {
  user: User | null
  signIn: (provider: 'github' | 'google') => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const STORAGE_KEY = 'weldrr_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as User) : null
  })

  const signIn = useCallback((provider: 'github' | 'google') => {
    const next: User = {
      email: provider === 'github' ? 'you@github.com' : 'you@gmail.com',
      name: 'You',
      provider,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next)
  }, [])

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
