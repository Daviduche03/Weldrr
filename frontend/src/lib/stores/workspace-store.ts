import { create } from 'zustand'
import { workspaceApi } from '@/lib/api/workspace'
import type { Workspace } from '@/lib/types'

type WorkspaceState = {
  workspace: Workspace | null
  loading: boolean
  initialize: () => Promise<void>
  setWorkspace: (workspace: Workspace) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspace: null,
  loading: true,

  initialize: async () => {
    try {
      const ws = await workspaceApi.get()
      set({ workspace: ws, loading: false })
    } catch {
      set({ workspace: null, loading: false })
    }
  },

  setWorkspace: (workspace) => set({ workspace }),
}))

export function planLabel(plan: Workspace['plan']): string {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)} plan`
}
