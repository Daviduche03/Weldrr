export type Workspace = {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
}

export type SpecType = 'openapi' | 'graphql' | 'grpc' | 'asyncapi'

export type ProjectStatus = 'generating' | 'ready' | 'failed'

export type Project = {
  id: string
  name: string
  specType: SpecType
  specSource: 'paste' | 'url' | 'upload'
  status: ProjectStatus
  docsUrl: string
  sdkLanguages: string[]
  cliEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type Member = {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

export type ApiKey = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

export type Plan = 'free' | 'pro' | 'enterprise'

export type Activity = {
  id: string
  projectId: string
  projectName: string
  action: 'spec_updated' | 'generated' | 'failed' | 'released'
  detail: string
  at: string
}

export type DashboardMetrics = {
  totalProjects: number
  readyProjects: number
  generatingProjects: number
  failedProjects: number
  sdksPublished: number
  docsServed: number
}
