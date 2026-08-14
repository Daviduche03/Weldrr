import { z } from 'zod'

export const gitRepoSchema = z.object({
  provider: z.string().min(1),
  fullName: z.string().min(1),
  cloneUrl: z.string().url('Clone URL must be a valid URL'),
  defaultBranch: z.string().min(1),
  private: z.boolean(),
})

const projectFields = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(200),
  specType: z.enum(['openapi', 'graphql', 'grpc', 'asyncapi']),
  specSource: z.enum(['paste', 'url', 'upload', 'github', 'mintlify']),
  specUrl: z.string().trim().url('Spec URL must be a valid URL').optional(),
  spec: z.record(z.unknown()).optional(),
  specRaw: z.string().max(1_000_000).optional(),
  gitRepo: gitRepoSchema.optional(),
  sdkLanguages: z.array(z.string().min(1).max(50)).max(10).optional(),
  cliEnabled: z.boolean().optional(),
  publishMode: z.enum(['automerge', 'pr']).optional(),
  generateDocs: z.boolean().optional(),
})

export const createProjectSchema = projectFields.superRefine((value, ctx) => {
  if (value.specSource === 'github' && !value.gitRepo) {
    ctx.addIssue({
      code: 'custom',
      path: ['gitRepo'],
      message: 'gitRepo is required when specSource is github',
    })
  }
  if (value.specSource === 'mintlify' && !value.specUrl) {
    ctx.addIssue({
      code: 'custom',
      path: ['specUrl'],
      message: 'specUrl (the Mintlify repo) is required when specSource is mintlify',
    })
  }
})

export const updateProjectSchema = projectFields
  .partial()
  .extend({
    status: z.enum(['generating', 'ready', 'failed']).optional(),
    docsUrl: z.string().trim().url('Docs URL must be a valid URL').optional().or(z.literal('')),
    sdkLanguages: z.array(z.string().min(1).max(50)).max(10).optional(),
    cliEnabled: z.boolean().optional(),
    publishMode: z.enum(['automerge', 'pr']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['generating', 'ready', 'failed']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const projectParamsSchema = z.object({
  id: z.string().uuid('Invalid project id'),
})