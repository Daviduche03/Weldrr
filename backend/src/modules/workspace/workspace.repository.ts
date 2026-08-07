import { getDb } from '@/db/client'
import { workspaces, workspaceMembers, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { Workspace, NewWorkspace, WorkspaceMember, NewWorkspaceMember, User } from '@/db/schema'
import type { WorkspacePlan, WorkspaceRole } from '@/modules/workspace/workspace.types'

function db() {
  return getDb()
}

export type Membership = Pick<WorkspaceMember, 'workspaceId' | 'role' | 'userId' | 'email' | 'id'>

export const workspaceRepository = {
  async create(data: NewWorkspace): Promise<Workspace> {
    const [workspace] = await db().insert(workspaces).values(data).returning()
    return workspace
  },

  async findById(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db().select().from(workspaces).where(eq(workspaces.id, id))
    return workspace
  },

  async findBySlug(slug: string): Promise<Workspace | undefined> {
    const [workspace] = await db().select().from(workspaces).where(eq(workspaces.slug, slug))
    return workspace
  },

  async existsBySlug(slug: string): Promise<boolean> {
    const rows = await db().select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, slug))
    return rows.length > 0
  },

  async update(id: string, data: Partial<NewWorkspace>): Promise<Workspace | undefined> {
    const [workspace] = await db()
      .update(workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning()
    return workspace
  },

  async deleteWorkspace(id: string): Promise<void> {
    await db().delete(workspaces).where(eq(workspaces.id, id))
  },

  async findMembershipByUserId(userId: string): Promise<Membership | undefined> {
    const [member] = await db()
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
    return member
  },

  async findMembershipByEmail(workspaceId: string, email: string): Promise<WorkspaceMember | undefined> {
    const [member] = await db()
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.email, email)))
    return member
  },

  async findMemberById(id: string): Promise<WorkspaceMember | undefined> {
    const [member] = await db().select().from(workspaceMembers).where(eq(workspaceMembers.id, id))
    return member
  },

  async addMember(data: NewWorkspaceMember): Promise<WorkspaceMember> {
    const [member] = await db().insert(workspaceMembers).values(data).returning()
    return member
  },

async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return db()
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(workspaceMembers.createdAt)
  },

  async updateMemberRole(id: string, role: WorkspaceRole): Promise<WorkspaceMember | undefined> {
    const [member] = await db()
      .update(workspaceMembers)
      .set({ role })
      .where(eq(workspaceMembers.id, id))
      .returning()
    return member
  },

  async removeMember(id: string): Promise<void> {
    await db().delete(workspaceMembers).where(eq(workspaceMembers.id, id))
  },

  async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.email, email))
    return user
  },

  async findUserById(id: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.id, id))
    return user
  },
}