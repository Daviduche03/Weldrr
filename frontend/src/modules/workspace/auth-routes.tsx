import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkspaceProvider, useWorkspace } from '@/modules/workspace/workspace-provider'

function OnboardingGate() {
  const { workspace, loading } = useWorkspace()
  const { pathname } = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const onOnboarding = pathname === '/onboarding'

  if (!workspace && !onOnboarding) return <Navigate to="/onboarding" replace />

  return <Outlet />
}

export function AuthRoutes() {
  return (
    <WorkspaceProvider>
      <OnboardingGate />
    </WorkspaceProvider>
  )
}
