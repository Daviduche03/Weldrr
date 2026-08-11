import { create } from 'zustand'
import { workspaceApi } from '@/lib/api/workspace'
import { setActiveWorkspaceId, clearActiveWorkspaceId } from '@/lib/active-workspace'
import { queryClient } from '@/lib/query-client'
import type { Workspace } from '@/lib/types'

type WorkspaceState = {
  workspace: Workspace | null
  workspaces: Workspace[]
  loading: boolean
  initialize: () => Promise<void>
  setWorkspace: (workspace: Workspace) => void
  switchTo: (id: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspace: null,
  workspaces: [],
  loading: true,

  initialize: async () => {
    try {
      // A stored active id may point to a workspace the user is no longer a
      // member of. If so, clear it and fall back to the default workspace.
      let current: Workspace
      try {
        current = await workspaceApi.get()
      } catch {
        clearActiveWorkspaceId()
        current = await workspaceApi.get()
      }
      const all = await workspaceApi.list()
      setActiveWorkspaceId(current.id)
      set({ workspace: current, workspaces: all, loading: false })
    } catch {
      set({ workspace: null, workspaces: [], loading: false })
    }
  },

  setWorkspace: (workspace) => {
    setActiveWorkspaceId(workspace.id)
    set((s) => ({
      workspace,
      workspaces: s.workspaces.some((w) => w.id === workspace.id)
        ? s.workspaces
        : [...s.workspaces, workspace],
    }))
    void queryClient.invalidateQueries()
  },

  switchTo: async (id) => {
    if (id === get().workspace?.id) return
    setActiveWorkspaceId(id)
    try {
      const current = await workspaceApi.get()
      set({ workspace: current })
      void queryClient.invalidateQueries()
    } catch {
      // switching failed; leave state as-is
    }
  },
}))

export function planLabel(plan: Workspace['plan']): string {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`
}
