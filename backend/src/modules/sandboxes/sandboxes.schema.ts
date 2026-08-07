import { z } from 'zod'
import { sandboxJobTypes, sandboxLanguages, sandboxStatuses } from '@/db/schema'

export const createSandboxSchema = z.object({
  projectId: z.string().uuid('Invalid project id').optional(),
  jobType: z.enum(['discovery', 'sdk', 'docs']).default('sdk'),
  language: z.enum(sandboxLanguages).optional(),
  spec: z.record(z.unknown()).optional(),
})

export const sandboxParamsSchema = z.object({
  id: z.string().uuid('Invalid sandbox id'),
})

export const sandboxQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  jobType: z.enum(sandboxJobTypes).optional(),
  status: z.enum(sandboxStatuses).optional(),
  projectId: z.string().uuid('Invalid project id').optional(),
})

export const startSandboxSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required').max(20_000),
})

export const sandboxCallbackSchema = z.object({
  sandboxId: z.string().uuid('Invalid sandbox id'),
  token: z.string().min(1, 'Token is required'),
  status: z.enum(['finished', 'failed']),
  artifactUrl: z.string().trim().url('Artifact URL must be valid').optional(),
  summary: z.string().trim().max(2_000).optional(),
})

export const sandboxBootstrapQuerySchema = z.object({
  token: z.string().min(1, 'Token is required'),
})
