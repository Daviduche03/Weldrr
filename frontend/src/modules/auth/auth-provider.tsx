import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

// Compatibility wrapper — state now lives in the zustand auth store.
export function AuthProvider({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return <>{children}</>
}

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const signOut = useAuthStore((s) => s.signOut)
  return { user, status, login, register, signOut }
}
