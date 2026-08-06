import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LandingPage } from '@/modules/landing/landing.page'
import { LoginPage } from '@/modules/auth/login.page'
import { RequireAuth } from '@/modules/auth/require-auth'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/modules/dashboard/dashboard.page'
import { OnboardingPage } from '@/modules/onboarding/onboarding.page'
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
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectsPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
          { path: '/onboarding', element: <OnboardingPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },])

export function AppRouter() {
  return <RouterProvider router={router} />
}
