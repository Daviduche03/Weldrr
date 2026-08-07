export type WorkspaceRole = 'owner' | 'admin' | 'member'

export type Plan = 'free' | 'pro' | 'enterprise'

export type Workspace = {
  id: string
  name: string
  slug: string
  plan: Plan
  role: WorkspaceRole
  members: number
  createdAt: string
  updatedAt: string
}

export type User = {
  id: string
  email: string
  name: string
  accountType: 'developer' | 'team'
  company: string | null
  avatarUrl: string | null
  isEmailVerified: boolean
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type LoginResult = {
  user: User
  tokens: AuthTokens
}

export type SpecType = 'openapi' | 'graphql' | 'grpc' | 'asyncapi'

export type ProjectStatus = 'generating' | 'ready' | 'failed'

export type GitRepo = {
  provider: string
  fullName: string
  cloneUrl: string
  defaultBranch: string
  private: boolean
}

export type Project = {
  id: string
  name: string
  specType: SpecType
  specSource: 'paste' | 'url' | 'upload' | 'github'
  status: ProjectStatus
  docsUrl: string
  sdkVersion: string | null
  docsVersion: string | null
  sdkLanguages: string[]
  cliEnabled: boolean
  gitRepo: GitRepo | null
  createdAt: string
  updatedAt: string
}

export type CreateProjectInput = {
  name: string
  specType: SpecType
  specSource: 'paste' | 'url' | 'upload' | 'github'
  specUrl?: string
  specRaw?: string
  gitRepo?: GitRepo
  sdkLanguages?: string[]
  cliEnabled?: boolean
}

export type GitHubConnection = {
  connected: boolean
  login?: string
  avatarUrl?: string | null
  scopes?: string[]
}

export type GitHubRepo = {
  id: number
  fullName: string
  cloneUrl: string
  private: boolean
  defaultBranch: string
  description: string | null
  updatedAt: string
  language: string | null
  ownerAvatarUrl: string | null
}

export type Member = {
  id: string
  email: string
  role: WorkspaceRole
  joinedAt: string
  accepted?: boolean
}

export type ApiKey = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

export type ActivityAction =
  | 'workspace_created'
  | 'created'
  | 'deleted'
  | 'spec_updated'
  | 'generated'
  | 'failed'
  | 'released'
  | 'member_added'
  | 'member_removed'
  | 'role_changed'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'plan_changed'

export type Activity = {
  id: string
  projectId: string | null
  projectName: string
  action: ActivityAction
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
  usage: {
    docs: number
    sdks: number
    cli: number
    mcp: number
  }
}

export type DashboardData = {
  metrics: DashboardMetrics
  activity: Activity[]
}

export type SdkLanguage = 'typescript' | 'python' | 'java' | 'go' | 'ruby' | 'php'

export type SdkStatus = 'draft' | 'generating' | 'ready' | 'failed'

export type Sdk = {
  id: string
  projectId: string
  name: string
  language: SdkLanguage
  status: SdkStatus
  createdAt: string
  updatedAt: string
}

export type DiscoveryEndpoint = {
  method: string
  path: string
  summary: string | null
  operationId: string | null
  requestBody: string | null
  responses: { status: string; schema: string | null }[]
  auth: string | null
}

export type Discovery = {
  status: 'pending' | 'running' | 'ready' | 'failed'
  version: string | null
  docsMarkdown: string
  endpoints: DiscoveryEndpoint[]
  narrative: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export type SandboxJobType = 'discovery' | 'sdk' | 'docs'

export type SandboxStatus =
  | 'issuing'
  | 'starting'
  | 'ready'
  | 'building'
  | 'finished'
  | 'failed'
  | 'terminated'

export type Sandbox = {
  id: string
  projectId: string | null
  jobType: SandboxJobType
  language: string | null
  status: SandboxStatus
  modalSandboxId: string | null
  tunnelUrl: string | null
  artifactUrl: string | null
  version: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export type ArtifactVersion = {
  id: string
  artifactType: 'sdk' | 'docs'
  version: string
  artifactUrl: string | null
  sandboxId: string | null
  discoveryId: string | null
  notes: string | null
  createdAt: string
}
