import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth'
import { dashboardApi } from '@/lib/api/dashboard'
import { projectApi, type UpdateProjectInput } from '@/lib/api/projects'
import { sdkApi } from '@/lib/api/sdks'
import { sandboxApi, type IssueSandboxInput } from '@/lib/api/sandboxes'
import { versionApi } from '@/lib/api/versions'
import { workspaceApi } from '@/lib/api/workspace'
import { connectionApi } from '@/lib/api/connections'
import { docsApi, type BrandingConfig, type BrandingAsset } from '@/lib/api/docs'
import type { SdkLanguage, SandboxStatus, SandboxJobType } from '@/lib/types'

export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  projectDiscovery: (id: string) => ['projects', id, 'discovery'] as const,
  projectVersions: (id: string) => ['projects', id, 'versions'] as const,
  projectSdks: (id: string) => ['projects', id, 'sdks'] as const,
  projectDocs: (id: string) => ['projects', id, 'docs', 'tree'] as const,
  projectDocsFile: (id: string, path: string) => ['projects', id, 'docs', 'file', path] as const,
  projectBranding: (id: string) => ['projects', id, 'docs', 'branding'] as const,
  sdkTree: (id: string, language: SdkLanguage) => ['projects', id, 'sdks', language, 'tree'] as const,
  sdkFile: (id: string, language: SdkLanguage, path: string) =>
    ['projects', id, 'sdks', language, 'file', path] as const,
  sandboxes: (params?: { projectId?: string; jobType?: SandboxJobType; status?: SandboxStatus }) =>
    ['sandboxes', params ?? {}] as const,
  dashboard: ['dashboard'] as const,
  members: ['workspace', 'members'] as const,
  connections: ['connections'] as const,
  workspace: ['workspace'] as const,
  me: ['me'] as const,
}

/* ------------------------------- Queries ------------------------------- */

export function useProjects(status?: string) {
  return useQuery({
    queryKey: ['projects', { status }],
    queryFn: () => projectApi.list(status as never),
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.project(id ?? ''),
    queryFn: () => projectApi.get(id!),
    enabled: !!id,
  })
}

export function useDiscovery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projectDiscovery(id ?? ''),
    queryFn: () => projectApi.discovery(id!),
    enabled: !!id,
  })
}

export function useVersions(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projectVersions(id ?? ''),
    queryFn: () => versionApi.list(id!),
    enabled: !!id,
  })
}

export function useSdks(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projectSdks(id ?? ''),
    queryFn: () => sdkApi.list(id!),
    enabled: !!id,
  })
}

export function useDocsTree(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projectDocs(id ?? ''),
    queryFn: () => docsApi.tree(id!),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useDocsFile(id: string | undefined, path: string | null) {
  return useQuery({
    queryKey: queryKeys.projectDocsFile(id ?? '', path ?? ''),
    queryFn: () => docsApi.readFile(id!, path!),
    enabled: !!id && !!path,
    staleTime: 60_000,
  })
}

export function useBranding(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projectBranding(id ?? ''),
    queryFn: () => docsApi.readBranding(id!),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useSdkTree(id: string | undefined, language: SdkLanguage) {
  return useQuery({
    queryKey: queryKeys.sdkTree(id ?? '', language),
    queryFn: () => sdkApi.tree(id!, language),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useSdkFile(id: string | undefined, language: SdkLanguage, path: string | null) {
  return useQuery({
    queryKey: queryKeys.sdkFile(id ?? '', language, path ?? ''),
    queryFn: () => sdkApi.readFile(id!, language, path!),
    enabled: !!id && !!path,
    staleTime: 60_000,
  })
}

export function useSandboxes(params?: { projectId?: string; jobType?: SandboxJobType }) {
  return useQuery({
    queryKey: queryKeys.sandboxes(params),
    queryFn: () => sandboxApi.list(params),
    staleTime: 15_000,
  })
}

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: () => dashboardApi.get() })
}

export function useMembers() {
  return useQuery({ queryKey: queryKeys.members, queryFn: () => workspaceApi.listMembers() })
}

export function useMe() {
  return useQuery({ queryKey: queryKeys.me, queryFn: () => authApi.me() })
}

export function useConnections() {
  return useQuery({ queryKey: queryKeys.connections, queryFn: () => connectionApi.list() })
}

/* ------------------------------ Mutations ------------------------------ */

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      projectApi.update(id, input),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.project(id) })
      void qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useRemoveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useRerunDiscovery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectApi.rerunDiscovery(id),
    onSuccess: (_data, id) => void qc.invalidateQueries({ queryKey: queryKeys.projectDiscovery(id) }),
  })
}

export function useIssueSandbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: IssueSandboxInput) => sandboxApi.issue(input),
    onSuccess: (_data, input) => {
      if (input.projectId) void qc.invalidateQueries({ queryKey: queryKeys.sandboxes({ projectId: input.projectId }) })
    },
  })
}

export function useStartSandbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, prompt }: { id: string; prompt: string }) => sandboxApi.start(id, prompt),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.sandboxes() }),
  })
}

export function useTerminateSandbox() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sandboxApi.terminate(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.sandboxes() }),
  })
}

export function useWriteBranding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, config, assets }: { id: string; config: BrandingConfig; assets?: BrandingAsset[] }) =>
      docsApi.writeBranding(id, config, assets),
    onSuccess: (_data, { id }) => void qc.invalidateQueries({ queryKey: queryKeys.projectBranding(id) }),
  })
}

export function useSaveToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof connectionApi.saveToken>[0]) => connectionApi.saveToken(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.connections }),
  })
}

export function useDisconnect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (provider: string) => connectionApi.disconnect(provider as never),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.connections }),
  })
}

export function useAddSdk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, name, language }: { projectId: string; name: string; language?: SdkLanguage }) =>
      sdkApi.create(projectId, { name, language }),
    onSuccess: (_data, { projectId }) => void qc.invalidateQueries({ queryKey: queryKeys.projectSdks(projectId) }),
  })
}

export function useRemoveSdk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, id }: { projectId: string; id: string }) => sdkApi.remove(projectId, id),
    onSuccess: (_data, { projectId }) => void qc.invalidateQueries({ queryKey: queryKeys.projectSdks(projectId) }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof authApi.updateProfile>[0]) => authApi.updateProfile(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.me }),
  })
}

export function useUpdateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof workspaceApi.update>[0]) => workspaceApi.update(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.workspace })
      void qc.invalidateQueries({ queryKey: queryKeys.members })
    },
  })
}

export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: 'admin' | 'member' }) =>
      workspaceApi.inviteMember(email, role),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.members }),
  })
}

export function useUpdateMemberRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'member' }) =>
      workspaceApi.updateMemberRole(id, role),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.members }),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workspaceApi.removeMember(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.members }),
  })
}

export function useRemoveWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => workspaceApi.remove(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['workspace'] }),
  })
}
