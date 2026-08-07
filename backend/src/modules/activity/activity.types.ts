export type ActivityAction =
  | 'workspace_created'
  | 'created'
  | 'deleted'
  | 'spec_updated'
  | 'generated'
  | 'failed'
  | 'released'
  | 'member_added'
  | 'member_removed'
  | 'role_changed'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'plan_changed'

export type ActivityResponse = {
  id: string
  projectId: string | null
  projectName: string
  action: ActivityAction
  detail: string
  createdAt: Date
}

export type RecordActivityInput = {
  workspaceId: string
  projectId: string | null
  projectName: string
  action: ActivityAction
  detail: string
}

export type ActivityQuery = {
  page: number
  limit: number
}