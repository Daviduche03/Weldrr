import bcrypt from 'bcrypt'
import { getDb } from '@/db/client'
import { projects as projectsTable, activity as activityTable } from '@/db/schema'
import { authRepository } from '@/modules/auth/auth.repository'
import { workspaceRepository } from '@/modules/workspace/workspace.repository'
import { projectRepository } from '@/modules/projects/projects.repository'
import { activityRepository } from '@/modules/activity/activity.repository'
import { sdkRepository } from '@/modules/sdks/sdk.repository'
import { logger } from '@/utils/logger'
import type { Workspace, Project } from '@/db/schema'

const OWNER_EMAIL = 'admin@weldrr.app'
const OWNER_PASSWORD = 'admin123'

const WORKSPACE = {
  name: 'Acme Corp',
  slug: 'acme',
  plan: 'pro' as const,
  docsServed: 20_000_000,
  sdksPublished: 128,
  usageDocs: 1_200_000,
  usageSdks: 486_000,
  usageCli: 92_000,
  usageMcp: 41_000,
}

const PROJECTS = [
  {
    name: 'Voice Agents API',
    specType: 'openapi' as const,
    specSource: 'url' as const,
    status: 'ready' as const,
    docsUrl: 'https://docs.example.com',
    sdkLanguages: ['typescript', 'python', 'go'],
    cliEnabled: true,
    createdAt: new Date('2026-07-02T10:00:00Z'),
    updatedAt: new Date('2026-08-01T14:30:00Z'),
  },
  {
    name: 'Payments SDK',
    specType: 'graphql' as const,
    specSource: 'paste' as const,
    status: 'generating' as const,
    docsUrl: '',
    sdkLanguages: ['typescript'],
    cliEnabled: false,
    createdAt: new Date('2026-07-20T09:00:00Z'),
    updatedAt: new Date('2026-08-04T11:00:00Z'),
  },
  {
    name: 'Realtime Events',
    specType: 'asyncapi' as const,
    specSource: 'upload' as const,
    status: 'failed' as const,
    docsUrl: '',
    sdkLanguages: [],
    cliEnabled: false,
    createdAt: new Date('2026-07-28T16:00:00Z'),
    updatedAt: new Date('2026-07-28T16:05:00Z'),
  },
]

const ACTIVITY = [
  {
    projectName: 'Payments SDK',
    action: 'generated' as const,
    detail: 'TypeScript SDK v2.1 generated',
    createdAt: new Date('2026-08-04T11:00:00Z'),
  },
  {
    projectName: 'Voice Agents API',
    action: 'spec_updated' as const,
    detail: 'OpenAPI spec updated with 4 new endpoints',
    createdAt: new Date('2026-08-01T14:30:00Z'),
  },
  {
    projectName: 'Realtime Events',
    action: 'failed' as const,
    detail: 'AsyncAPI spec failed to validate',
    createdAt: new Date('2026-07-28T16:05:00Z'),
  },
  {
    projectName: 'Voice Agents API',
    action: 'released' as const,
    detail: 'Python SDK v3.4 published to PyPI',
    createdAt: new Date('2026-07-25T09:00:00Z'),
  },
  {
    projectName: 'Voice Agents API',
    action: 'generated' as const,
    detail: 'CLI v1.2 generated',
    createdAt: new Date('2026-07-20T15:00:00Z'),
  },
]

async function seedUserAndWorkspace(): Promise<Workspace> {
  let user = await authRepository.findUserByEmail(OWNER_EMAIL)

  if (!user) {
    const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12)
    user = await authRepository.createUser({
      email: OWNER_EMAIL,
      name: 'Weldrr Admin',
      accountType: 'team',
      passwordHash,
      isEmailVerified: true,
    })
    logger.info('Seeded owner user')
  }

  const membership = await workspaceRepository.findMembershipByUserId(user.id)
  if (membership) {
    const existing = await workspaceRepository.findById(membership.workspaceId)
    if (existing) return existing
  }

  const workspace = await workspaceRepository.create({ ...WORKSPACE })
  await workspaceRepository.addMember({
    workspaceId: workspace.id,
    userId: user.id,
    email: user.email,
    role: 'owner',
  })
  logger.info('Seeded workspace and owner membership')

  return workspace
}

async function seedMembers(workspace: Workspace): Promise<void> {
  const members = [
    { email: 'alex@acme.com', role: 'admin' as const },
    { email: 'sam@acme.com', role: 'member' as const },
  ]

  for (const member of members) {
    const existing = await workspaceRepository.findMembershipByEmail(workspace.id, member.email)
    if (!existing) {
      await workspaceRepository.addMember({
        workspaceId: workspace.id,
        email: member.email,
        role: member.role,
        userId: null,
      })
      logger.info(`Seeded member ${member.email}`)
    }
  }
}

async function seedProjects(workspace: Workspace): Promise<Project[]> {
  const existing = await getDb().select().from(projectsTable)
  if (existing.length > 0) return existing

  const created: Project[] = []
  for (const project of PROJECTS) {
    const row = await projectRepository.create(workspace.id, {
      name: project.name,
      specType: project.specType,
      specSource: project.specSource,
      status: project.status,
      docsUrl: project.docsUrl,
      sdkLanguages: project.sdkLanguages,
      cliEnabled: project.cliEnabled,
      spec: null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    created.push(row)
  }
  logger.info(`Seeded ${created.length} projects`)
  return created
}

async function seedActivity(workspace: Workspace): Promise<void> {
  const db = getDb()
  const existing = await db.select({ id: activityTable.id }).from(activityTable)
  if (existing.length > 0) return

  for (const item of ACTIVITY) {
    await activityRepository.create({
      workspaceId: workspace.id,
      projectId: null,
      projectName: item.projectName,
      action: item.action,
      detail: item.detail,
      createdAt: item.createdAt,
    })
  }
  logger.info('Seeded activity')
}

async function seedSdks(workspace: Workspace, projects: Project[]): Promise<void> {
  const firstProject = projects[0]
  if (!firstProject) return

  const existing = await sdkRepository.listForProject(workspace.id, firstProject.id)
  if (existing.length > 0) return

  await sdkRepository.create(workspace.id, firstProject.id, {
    name: 'typescript-client',
    language: 'typescript',
    status: 'ready',
  })
  await sdkRepository.create(workspace.id, firstProject.id, {
    name: 'python-client',
    language: 'python',
    status: 'ready',
  })
  logger.info('Seeded sdks')
}

export async function seedAll(): Promise<void> {
  const workspace = await seedUserAndWorkspace()
  await seedMembers(workspace)
  const projects = await seedProjects(workspace)
  await seedActivity(workspace)
  await seedSdks(workspace, projects)
  logger.info('Seed complete')
}