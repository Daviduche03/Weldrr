import { http } from '@/lib/http'
import type { Member, Plan, Workspace } from '@/lib/types'

export type UpdateWorkspaceInput = {
  name?: string
  slug?: string
  plan?: Plan
}

export type CreateWorkspaceInput = {
  name: string
  slug?: string
}

export const workspaceApi = {
  get: (): Promise<Workspace> => http.get<Workspace>('/api/workspace'),

  create: (input: CreateWorkspaceInput): Promise<Workspace> =>
    http.post<Workspace>('/api/workspace', input),

  update: (input: UpdateWorkspaceInput): Promise<Workspace> =>
    http.patch<Workspace>('/api/workspace', input),

  listMembers: (): Promise<Member[]> => http.get<Member[]>('/api/workspace/members'),

  inviteMember: (email: string, role: 'admin' | 'member' = 'member'): Promise<Member> =>
    http.post<Member>('/api/workspace/members', { email, role }),

  updateMemberRole: (id: string, role: 'admin' | 'member'): Promise<Member> =>
    http.patch<Member>(`/api/workspace/members/${id}`, { role }),

  removeMember: (id: string): Promise<void> =>
    http.remove<void>(`/api/workspace/members/${id}`),

  remove: (): Promise<void> => http.remove<void>('/api/workspace'),
}
