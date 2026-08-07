import { z } from 'zod'

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, 'Key name is required').max(100),
})

export const apiKeyParamsSchema = z.object({
  id: z.string().uuid('Invalid api key id'),
})