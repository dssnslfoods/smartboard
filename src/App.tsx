import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/pages/HomePage'
import { DashboardView } from '@/pages/DashboardView'
import { SourcesPage } from '@/pages/SourcesPage'
import { WidgetBuilderPage } from '@/pages/WidgetBuilderPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { IntelligencePage } from '@/pages/IntelligencePage'
import { CustomersPage } from '@/pages/CustomersPage'
import { ReportsPage } from '@/pages/ReportsPage'

const router = createBrowserRouter([
  // Intelligence Dashboard is the primary landing page (standalone, light theme).
  { path: '/', element: <IntelligencePage /> },
  { path: '/customers', element: <CustomersPage /> },
  { path: '/reports', element: <ReportsPage /> },
  // The multi-source Boardroom portal lives under /boardroom.
  {
    path: '/boardroom',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard/:id', element: <DashboardView /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'widget-builder', element: <WidgetBuilderPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
