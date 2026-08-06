import type { Activity, ApiKey, DashboardMetrics, Member, Plan, Project, Workspace } from '@/lib/types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const workspace: Workspace = {
  id: 'ws_1',
  name: 'Acme Corp',
  slug: 'acme',
  plan: 'pro',
}

let projects: Project[] = [
  {
    id: 'prj_1',
    name: 'Voice Agents API',
    specType: 'openapi',
    specSource: 'url',
    status: 'ready',
    docsUrl: 'https://docs.example.com',
    sdkLanguages: ['typescript', 'python', 'go'],
    cliEnabled: true,
    createdAt: '2026-07-02T10:00:00Z',
    updatedAt: '2026-08-01T14:30:00Z',
  },
  {
    id: 'prj_2',
    name: 'Payments SDK',
    specType: 'graphql',
    specSource: 'paste',
    status: 'generating',
    docsUrl: '',
    sdkLanguages: ['typescript'],
    cliEnabled: false,
    createdAt: '2026-07-20T09:00:00Z',
    updatedAt: '2026-08-04T11:00:00Z',
  },
  {
    id: 'prj_3',
    name: 'Realtime Events',
    specType: 'asyncapi',
    specSource: 'upload',
    status: 'failed',
    docsUrl: '',
    sdkLanguages: [],
    cliEnabled: false,
    createdAt: '2026-07-28T16:00:00Z',
    updatedAt: '2026-07-28T16:05:00Z',
  },
]

let members: Member[] = [
  { id: 'mem_1', email: 'you@acme.com', role: 'owner', joinedAt: '2026-07-01T00:00:00Z' },
  { id: 'mem_2', email: 'alex@acme.com', role: 'admin', joinedAt: '2026-07-10T00:00:00Z' },
  { id: 'mem_3', email: 'sam@acme.com', role: 'member', joinedAt: '2026-07-15T00:00:00Z' },
]

let apiKeys: ApiKey[] = [
  { id: 'key_1', name: 'CI pipeline', prefix: 'wr_7f3a', createdAt: '2026-07-12T00:00:00Z', lastUsedAt: '2026-08-03T10:00:00Z' },
]

const profile = { name: 'You', email: 'you@acme.com' }

const activity: Activity[] = [
  {
    id: 'act_1',
    projectId: 'prj_2',
    projectName: 'Payments SDK',
    action: 'generated',
    detail: 'TypeScript SDK v2.1 generated',
    at: '2026-08-04T11:00:00Z',
  },
  {
    id: 'act_2',
    projectId: 'prj_1',
    projectName: 'Voice Agents API',
    action: 'spec_updated',
    detail: 'OpenAPI spec updated with 4 new endpoints',
    at: '2026-08-01T14:30:00Z',
  },
  {
    id: 'act_3',
    projectId: 'prj_3',
    projectName: 'Realtime Events',
    action: 'failed',
    detail: 'AsyncAPI spec failed to validate',
    at: '2026-07-28T16:05:00Z',
  },
  {
    id: 'act_4',
    projectId: 'prj_1',
    projectName: 'Voice Agents API',
    action: 'released',
    detail: 'Python SDK v3.4 published to PyPI',
    at: '2026-07-25T09:00:00Z',
  },
  {
    id: 'act_5',
    projectId: 'prj_1',
    projectName: 'Voice Agents API',
    action: 'generated',
    detail: 'CLI v1.2 generated',
    at: '2026-07-20T15:00:00Z',
  },
]

export const api = {
  getWorkspace: async (): Promise<Workspace> => {
    await delay(200)
    return workspace
  },

  listProjects: async (): Promise<Project[]> => {
    await delay(300)
    return [...projects]
  },

  getProject: async (id: string): Promise<Project | undefined> => {
    await delay(250)
    return projects.find((p) => p.id === id)
  },

  createProject: async (input: {
    name: string
    specType: Project['specType']
    specSource: Project['specSource']
  }): Promise<Project> => {
    await delay(400)
    const project: Project = {
      id: `prj_${projects.length + 1}`,
      name: input.name,
      specType: input.specType,
      specSource: input.specSource,
      status: 'generating',
      docsUrl: '',
      sdkLanguages: [],
      cliEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    projects = [project, ...projects]
    return project
  },

  listMembers: async (): Promise<Member[]> => {
    await delay(200)
    return [...members]
  },

  listApiKeys: async (): Promise<ApiKey[]> => {
    await delay(200)
    return [...apiKeys]
  },

  listActivity: async (): Promise<Activity[]> => {
    await delay(250)
    return [...activity]
  },

  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    await delay(200)
    return {
      totalProjects: projects.length,
      readyProjects: projects.filter((p) => p.status === 'ready').length,
      generatingProjects: projects.filter((p) => p.status === 'generating').length,
      failedProjects: projects.filter((p) => p.status === 'failed').length,
      sdksPublished: 128,
      docsServed: 20_000_000,
      usage: {
        docs: 1_200_000,
        sdks: 486_000,
        cli: 92_000,
        mcp: 41_000,
      },
    }
  },

  updatePlan: async (plan: Plan): Promise<void> => {
    await delay(300)
    workspace.plan = plan
  },

  getProfile: async (): Promise<{ name: string; email: string }> => {
    await delay(150)
    return { ...profile }
  },

  updateProfile: async (input: { name: string }): Promise<{ name: string; email: string }> => {
    await delay(300)
    profile.name = input.name
    return { ...profile }
  },

  updateWorkspace: async (input: { name: string; slug: string }): Promise<Workspace> => {
    await delay(300)
    workspace.name = input.name
    workspace.slug = input.slug
    return { ...workspace }
  },

  inviteMember: async (email: string): Promise<Member> => {
    await delay(300)
    const member: Member = {
      id: `mem_${members.length + 1}`,
      email,
      role: 'member',
      joinedAt: new Date().toISOString(),
    }
    members = [member, ...members]
    return member
  },

  updateMemberRole: async (id: string, role: Member['role']): Promise<void> => {
    await delay(200)
    members = members.map((m) => (m.id === id ? { ...m, role } : m))
  },

  removeMember: async (id: string): Promise<void> => {
    await delay(250)
    members = members.filter((m) => m.id !== id)
  },

  createApiKey: async (name: string): Promise<ApiKey & { secret: string }> => {
    await delay(350)
    const secret = `wr_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`
    const key: ApiKey = {
      id: `key_${apiKeys.length + 1}`,
      name,
      prefix: secret.slice(0, 10),
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    }
    apiKeys = [key, ...apiKeys]
    return { ...key, secret }
  },

  revokeApiKey: async (id: string): Promise<void> => {
    await delay(250)
    apiKeys = apiKeys.filter((k) => k.id !== id)
  },
}
