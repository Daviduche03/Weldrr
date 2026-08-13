import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserRemove01Icon } from 'hugeicons-react'
import { Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog, type ConfirmDialogTone } from '@/components/ui/confirm-dialog'
import { workspaceApi } from '@/lib/api/workspace'
import type { Member, Plan, User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/modules/workspace/workspace-provider'
import { useMe, useMembers, useUpdateProfile, useUpdateWorkspace, useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/lib/queries'
import { tabs, type SettingsTab } from '@/modules/settings/settings.data'
import { useFlash } from '@/modules/settings/settings.hooks'

type PendingAction =
  | { kind: 'remove-member'; member: Member }
  | { kind: 'delete-workspace' }

type DialogConfig = {
  title: string
  description: string
  icon: ReactNode
  tone: ConfirmDialogTone
  confirmLabel: string
  onConfirm: () => void
}
import { ProfileSection } from '@/modules/settings/sections/profile-section'
import { WorkspaceSection } from '@/modules/settings/sections/workspace-section'
import { MembersSection } from '@/modules/settings/sections/members-section'
import { BillingSection } from '@/modules/settings/sections/billing-section'
import {
  NotificationsSection,
  type NotificationState,
} from '@/modules/settings/sections/notifications-section'
import { ConnectionsSection } from '@/modules/settings/sections/connections-section'

function SettingsSkeleton() {
  return (
    <div>
      <div className="px-6 sm:px-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="mt-8 space-y-6 px-6 sm:px-8">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { workspace, setWorkspace, removeCurrent } = useWorkspace()
  const [tab, setTab] = useState<SettingsTab>(() =>
    new URLSearchParams(location.search).get('connections') ? 'Connections' : 'Profile',
  )
  const [banner, setBanner] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [deletingWorkspace, setDeletingWorkspace] = useState(false)

  const [profile, setProfile] = useState<User | null>(null)
  const [members, setMembers] = useState<Member[]>([])

  const [name, setName] = useState('')
  const [wsName, setWsName] = useState('')
  const [wsSlug, setWsSlug] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro')
  const [notifications, setNotifications] = useState<NotificationState>({
    generation: true,
    failures: true,
    releases: false,
    digest: false,
  })

  const [profileSaved, saveProfileFlash] = useFlash()
  const [workspaceSaved, saveWorkspaceFlash] = useFlash()
  const [planSaved, savePlanFlash] = useFlash()

  // Source of truth queries (cached by react-query, so navigating back to
  // settings doesn't refetch). Local state below mirrors them for editing.
  const meQuery = useMe()
  const membersQuery = useMembers()

  useEffect(() => {
    if (meQuery.data) {
      setProfile(meQuery.data)
      setName(meQuery.data.name)
    }
  }, [meQuery.data])

  useEffect(() => {
    if (membersQuery.data) setMembers(membersQuery.data)
  }, [membersQuery.data])

  useEffect(() => {
    if (!workspace) return
    setWsName(workspace.name)
    setWsSlug(workspace.slug)
    setSelectedPlan(workspace.plan)
  }, [workspace])

  const updateProfileMutation = useUpdateProfile()
  const updateWorkspaceMutation = useUpdateWorkspace()
  const inviteMutation = useInviteMember()
  const changeRoleMutation = useUpdateMemberRole()
  const removeMemberMutation = useRemoveMember()

  const saveProfile = () => {
    updateProfileMutation
      .mutateAsync({ name })
      .then((updated) => {
        setProfile(updated)
        setName(updated.name)
        saveProfileFlash()
      })
      .catch((err: unknown) => setBanner(err instanceof Error ? err.message : 'Failed to save'))
  }

  const saveWorkspace = () => {
    updateWorkspaceMutation
      .mutateAsync({ name: wsName, slug: wsSlug })
      .then((updated) => {
        setWorkspace(updated)
        setWsName(updated.name)
        setWsSlug(updated.slug)
        saveWorkspaceFlash()
      })
      .catch((err: unknown) => setBanner(err instanceof Error ? err.message : 'Failed to save'))
  }

  const invite = () => {
    const email = inviteEmail.trim()
    if (!email || !email.includes('@')) return
    inviteMutation
      .mutateAsync({ email, role: 'member' })
      .then(() => setInviteEmail(''))
      .catch((err: unknown) =>
        setBanner(err instanceof Error ? err.message : 'Failed to invite member'),
      )
  }

  const changeRole = (id: string, role: Member['role']) => {
    if (role !== 'admin' && role !== 'member') return
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
    changeRoleMutation.mutate({ id, role }, {
      onError: () => void membersQuery.refetch(),
    })
  }

  const removeMember = (id: string) => {
    const member = members.find((m) => m.id === id)
    if (!member) return
    setPending({ kind: 'remove-member', member })
  }

  const selectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    updateWorkspaceMutation
      .mutateAsync({ plan })
      .then((updated) => {
        setWorkspace(updated)
        savePlanFlash()
      })
      .catch((err: unknown) => {
        setSelectedPlan(workspace?.plan ?? 'pro')
        setBanner(err instanceof Error ? err.message : 'Failed to update plan')
      })
  }

  const confirmRemoveMember = () => {
    if (pending?.kind !== 'remove-member') return
    const member = pending.member
    setPending(null)
    removeMemberMutation.mutate(member.id, {
      onError: () => void membersQuery.refetch(),
    })
  }

  const confirmDeleteWorkspace = async () => {
    if (pending?.kind !== 'delete-workspace') return
    setDeletingWorkspace(true)
    try {
      await workspaceApi.remove()
      setPending(null)
      setDeletingWorkspace(false)
      const next = await removeCurrent()
      if (!next) {
        navigate('/onboarding')
      }
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Failed to delete workspace')
      setDeletingWorkspace(false)
    }
  }

  const dialog = ((): DialogConfig | null => {
    switch (pending?.kind) {
      case 'remove-member':
        return {
          title: 'Remove member?',
          description: `${pending.member.email} will immediately lose access to this workspace and all of its projects.`,
          icon: <UserRemove01Icon />,
          tone: 'danger',
          confirmLabel: 'Remove member',
          onConfirm: confirmRemoveMember,
        }
      case 'delete-workspace':
        return {
          title: 'Delete workspace?',
          description: `${workspace?.name ?? 'This workspace'} and all of its projects, SDKs, and docs will be permanently deleted. This cannot be undone.`,
          icon: <Trash2 />,
          tone: 'danger',
          confirmLabel: 'Delete workspace',
          onConfirm: confirmDeleteWorkspace,
        }
      default:
        return null
    }
  })()

  const loading = meQuery.isLoading || membersQuery.isLoading

  if (loading) return <SettingsSkeleton />

  return (
    <div>
      <div className="px-6 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, workspace, and billing.
        </p>
      </div>

      {banner && (
        <div className="mx-6 mt-4 flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive sm:mx-8">
          <span>{banner}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="cursor-pointer font-medium underline-offset-4 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border px-6 sm:px-8">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t
                ? 'border-brand text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === 'Profile' && (
          <ProfileSection
            profile={profile}
            name={name}
            setName={setName}
            saved={profileSaved}
            onSave={saveProfile}
          />
        )}

        {tab === 'Workspace' && (
          <WorkspaceSection
            wsName={wsName}
            setWsName={setWsName}
            wsSlug={wsSlug}
            setWsSlug={setWsSlug}
            saved={workspaceSaved}
            onSave={saveWorkspace}
            onDelete={() => setPending({ kind: 'delete-workspace' })}
          />
        )}

        {tab === 'Members' && (
          <MembersSection
            members={members}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            onInvite={invite}
            onChangeRole={changeRole}
            onRemove={removeMember}
          />
        )}

        {tab === 'Billing' && (
          <BillingSection
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            saved={planSaved}
            onSave={() => selectPlan(selectedPlan)}
          />
        )}

        {tab === 'Notifications' && (
          <NotificationsSection
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}

        {tab === 'Connections' && <ConnectionsSection />}
      </div>

      {dialog && (
        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(open) => {
            if (!open) setPending(null)
          }}
          title={dialog.title}
          description={dialog.description}
          icon={dialog.icon}
          tone={dialog.tone}
          confirmLabel={dialog.confirmLabel}
          loading={deletingWorkspace}
          onConfirm={dialog.onConfirm}
        />
      )}
    </div>
  )
}