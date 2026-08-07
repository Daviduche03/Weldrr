import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Trash2, UserX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog, type ConfirmDialogTone } from '@/components/ui/confirm-dialog'
import { authApi } from '@/lib/api/auth'
import { workspaceApi } from '@/lib/api/workspace'
import { apiKeyApi } from '@/lib/api/api-keys'
import type { ApiKey, Member, Plan, User } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/modules/workspace/workspace-provider'
import { useAuth } from '@/modules/auth/auth-provider'
import { tabs, type SettingsTab } from '@/modules/settings/settings.data'
import { useFlash } from '@/modules/settings/settings.hooks'

type PendingAction =
  | { kind: 'revoke-key'; key: ApiKey }
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
import { ApiKeysSection } from '@/modules/settings/sections/api-keys-section'
import { BillingSection } from '@/modules/settings/sections/billing-section'
import {
  NotificationsSection,
  type NotificationState,
} from '@/modules/settings/sections/notifications-section'
import { GitHubSection } from '@/modules/settings/sections/github-section'

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
  const { signOut } = useAuth()
  const { workspace, setWorkspace } = useWorkspace()
  const [tab, setTab] = useState<SettingsTab>('Profile')
  const [loading, setLoading] = useState(true)
  const [banner, setBanner] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [deletingWorkspace, setDeletingWorkspace] = useState(false)

  const [profile, setProfile] = useState<User | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [keys, setKeys] = useState<ApiKey[]>([])

  const [name, setName] = useState('')
  const [wsName, setWsName] = useState('')
  const [wsSlug, setWsSlug] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<(ApiKey & { secret: string }) | null>(null)
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
  const [formInitialized, setFormInitialized] = useState(false)

  useEffect(() => {
    if (!workspace || formInitialized) return
    setFormInitialized(true)
    setWsName(workspace.name)
    setWsSlug(workspace.slug)
    setSelectedPlan(workspace.plan)
  }, [workspace, formInitialized])

  useEffect(() => {
    let mounted = true
    Promise.all([authApi.me(), workspaceApi.listMembers(), apiKeyApi.list()])
      .then(([p, m, k]) => {
        if (!mounted) return
        setProfile(p)
        setMembers(m)
        setKeys(k)
        setName(p.name)
      })
      .catch((err: unknown) => {
        if (mounted) setBanner(err instanceof Error ? err.message : 'Failed to load settings')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const saveProfile = () => {
    authApi
      .updateProfile({ name })
      .then((updated) => {
        setProfile(updated)
        setName(updated.name)
        saveProfileFlash()
      })
      .catch((err: unknown) => setBanner(err instanceof Error ? err.message : 'Failed to save'))
  }

  const saveWorkspace = () => {
    workspaceApi
      .update({ name: wsName, slug: wsSlug })
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
    workspaceApi
      .inviteMember(email)
      .then((member) => {
        setMembers((prev) => [member, ...prev])
        setInviteEmail('')
      })
      .catch((err: unknown) =>
        setBanner(err instanceof Error ? err.message : 'Failed to invite member'),
      )
  }

  const changeRole = (id: string, role: Member['role']) => {
    if (role !== 'admin' && role !== 'member') return
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
    workspaceApi.updateMemberRole(id, role).catch((err: unknown) => {
      workspaceApi
        .listMembers()
        .then(setMembers)
        .catch(() => {
          if (err instanceof Error) setBanner(err.message)
        })
    })
  }

  const removeMember = (id: string) => {
    const member = members.find((m) => m.id === id)
    if (!member) return
    setPending({ kind: 'remove-member', member })
  }

  const createKey = () => {
    const label = keyName.trim() || 'New key'
    apiKeyApi
      .create(label)
      .then((key) => {
        setKeys((prev) => [key, ...prev])
        setNewKey(key)
        setKeyName('')
      })
      .catch((err: unknown) =>
        setBanner(err instanceof Error ? err.message : 'Failed to create API key'),
      )
  }

  const revokeKey = (id: string) => {
    const key = keys.find((k) => k.id === id)
    if (!key) return
    setPending({ kind: 'revoke-key', key })
  }

  const selectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    workspaceApi
      .update({ plan })
      .then((updated) => {
        setWorkspace(updated)
        savePlanFlash()
      })
      .catch((err: unknown) => {
        setSelectedPlan(workspace?.plan ?? 'pro')
        setBanner(err instanceof Error ? err.message : 'Failed to update plan')
      })
  }

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
  }

  const confirmRemoveMember = () => {
    if (pending?.kind !== 'remove-member') return
    const member = pending.member
    const previous = members
    setMembers((prev) => prev.filter((m) => m.id !== member.id))
    setPending(null)
    workspaceApi.removeMember(member.id).catch((err: unknown) => {
      setMembers(previous)
      setBanner(err instanceof Error ? err.message : 'Failed to remove member')
    })
  }

  const confirmRevokeKey = () => {
    if (pending?.kind !== 'revoke-key') return
    const key = pending.key
    const previous = keys
    setKeys((prev) => prev.filter((k) => k.id !== key.id))
    if (newKey?.id === key.id) setNewKey(null)
    setPending(null)
    apiKeyApi.revoke(key.id).catch((err: unknown) => {
      setKeys(previous)
      setBanner(err instanceof Error ? err.message : 'Failed to revoke API key')
    })
  }

  const confirmDeleteWorkspace = async () => {
    if (pending?.kind !== 'delete-workspace') return
    setDeletingWorkspace(true)
    try {
      await workspaceApi.remove()
      setPending(null)
      await signOut()
      navigate('/')
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Failed to delete workspace')
      setDeletingWorkspace(false)
    }
  }

  const dialog = ((): DialogConfig | null => {
    switch (pending?.kind) {
      case 'revoke-key':
        return {
          title: 'Revoke API key?',
          description: `"${pending.key.name}" (${pending.key.prefix}…) will stop working immediately. Any services using it will lose access.`,
          icon: <KeyRound />,
          tone: 'warning',
          confirmLabel: 'Revoke key',
          onConfirm: confirmRevokeKey,
        }
      case 'remove-member':
        return {
          title: 'Remove member?',
          description: `${pending.member.email} will immediately lose access to this workspace and all of its projects.`,
          icon: <UserX />,
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

        {tab === 'API keys' && (
          <ApiKeysSection
            keys={keys}
            newKey={newKey}
            keyName={keyName}
            setKeyName={setKeyName}
            onCreate={createKey}
            onRevoke={revokeKey}
            onCopy={copy}
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

        {tab === 'GitHub' && <GitHubSection />}
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