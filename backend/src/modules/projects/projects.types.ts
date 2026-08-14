export type SpecType = 'openapi' | 'graphql' | 'grpc' | 'asyncapi'

export type SpecSource = 'paste' | 'url' | 'upload' | 'github' | 'mintlify'

export type GitRepo = {
  provider: string
  fullName: string
  cloneUrl: string
  defaultBranch: string
  private: boolean
}

export type ProjectStatus = 'generating' | 'ready' | 'failed'

export type PublishMode = 'automerge' | 'pr'

export type ProjectResponse = {
  id: string
  name: string
  specType: SpecType
  specSource: SpecSource
  status: ProjectStatus
  publishMode: PublishMode
  docsUrl: string
  sdkVersion: string | null
  docsVersion: string | null
  sdkLanguages: string[]
  cliEnabled: boolean
  generateDocs: boolean
  gitRepo: GitRepo | null
  createdAt: Date
  updatedAt: Date
}

export type CreateProjectInput = {
  name: string
  specType: SpecType
  specSource: SpecSource
  specUrl?: string
  spec?: Record<string, unknown>
  specRaw?: string
  gitRepo?: GitRepo
  sdkLanguages?: string[]
  cliEnabled?: boolean
  generateDocs?: boolean
  publishMode?: PublishMode
}

export type UpdateProjectInput = Partial<CreateProjectInput> & {
  status?: ProjectStatus
  docsUrl?: string
  sdkLanguages?: string[]
  cliEnabled?: boolean
  generateDocs?: boolean
  publishMode?: PublishMode
}

export type ProjectQuery = {
  page: number
  limit: number
  status?: ProjectStatus
  sortBy: 'name' | 'createdAt' | 'updatedAt'
  sortOrder: 'asc' | 'desc'
}