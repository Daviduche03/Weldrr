export type SdkLanguage = 'typescript' | 'python' | 'java' | 'go' | 'ruby' | 'php'

export type SdkStatus = 'draft' | 'generating' | 'ready' | 'failed'

export type SdkResponse = {
  id: string
  projectId: string
  name: string
  language: SdkLanguage
  status: SdkStatus
  createdAt: Date
  updatedAt: Date
}

export type CreateSdkInput = {
  name: string
  language?: SdkLanguage
  spec?: Record<string, unknown>
}

export type UpdateSdkInput = {
  name?: string
  language?: SdkLanguage
  status?: SdkStatus
}