export type ApiKeyResponse = {
  id: string
  name: string
  prefix: string
  createdAt: Date
  lastUsedAt: Date | null
}

export type CreateApiKeyResult = ApiKeyResponse & {
  secret: string
}

export type CreateApiKeyInput = {
  name: string
}