import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

export const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
      .optional(),
    plan: z.enum(['free', 'pro', 'enterprise']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  role: z.enum(['admin', 'member']).default('member'),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member'], { required_error: 'Role is required' }),
})

export const workspaceParamsSchema = z.object({
  id: z.string().uuid('Invalid member id'),
})