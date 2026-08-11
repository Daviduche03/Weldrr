import { useEffect, type ReactNode } from 'react'
import { useWorkspaceStore, planLabel } from '@/lib/stores/workspace-store'

export { planLabel }

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const initialize = useWorkspaceStore((s) => s.initialize)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return <>{children}</>
}

export function useWorkspace() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const loading = useWorkspaceStore((s) => s.loading)
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace)
  const switchTo = useWorkspaceStore((s) => s.switchTo)
  return { workspace, workspaces, loading, setWorkspace, switchTo }
}
