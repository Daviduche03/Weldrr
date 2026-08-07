import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { workspaceApi } from '@/lib/api/workspace'
import type { Workspace } from '@/lib/types'

type WorkspaceState = {
  workspace: Workspace | null
  loading: boolean
  setWorkspace: (workspace: Workspace) => void
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    workspaceApi
      .get()
      .then((ws) => {
        if (active) setWorkspace(ws)
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({ workspace, loading, setWorkspace }),
    [workspace, loading],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return context
}

export function planLabel(plan: Workspace['plan']): string {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`
}
