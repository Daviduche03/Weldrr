import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LandingPage } from '@/modules/landing/landing.page'
import { LoginPage } from '@/modules/auth/login.page'
import { RequireAuth } from '@/modules/auth/require-auth'
import { AppShell } from '@/components/layout/app-shell'
import { AuthRoutes } from '@/modules/workspace/auth-routes'
import { DashboardPage } from '@/modules/dashboard/dashboard.page'
import { OnboardingPage } from '@/modules/onboarding/onboarding.page'
import { NewProjectPage } from '@/modules/projects/new-project.page'
import { NewWorkspacePage } from '@/modules/workspace/new-workspace.page'
import { ProjectsPage } from '@/modules/projects/projects.page'
import { ProjectDetailPage } from '@/modules/projects/project-detail.page'
import { SettingsPage } from '@/modules/settings/settings.page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AuthRoutes />,
        children: [
          { path: '/onboarding', element: <OnboardingPage /> },
          {
            element: <AppShell />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/projects', element: <ProjectsPage /> },
              { path: '/projects/new', element: <NewProjectPage /> },
              { path: '/workspaces/new', element: <NewWorkspacePage /> },
              { path: '/projects/:id', element: <ProjectDetailPage /> },
              { path: '/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },])

export function AppRouter() {
  return <RouterProvider router={router} />
}
