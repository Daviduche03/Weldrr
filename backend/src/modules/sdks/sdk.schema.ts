import { z } from 'zod'

export const createSdkSchema = z.object({
  name: z.string().trim().min(1, 'SDK name is required').max(200),
  language: z.enum(['typescript', 'python', 'java', 'go', 'ruby', 'php']).default('typescript'),
  spec: z.record(z.unknown()).optional(),
})

export const updateSdkSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    language: z.enum(['typescript', 'python', 'java', 'go', 'ruby', 'php']).optional(),
    status: z.enum(['draft', 'generating', 'ready', 'failed']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })