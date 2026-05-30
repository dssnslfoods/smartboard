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
  // Boardroom multi-source portal — primary landing page.
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard/:id', element: <DashboardView /> },
      { path: 'sources', element: <SourcesPage /> },
      { path: 'widget-builder', element: <WidgetBuilderPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  // SmartSales Intelligence Dashboard — standalone light-theme portal.
  { path: '/smartsales', element: <IntelligencePage /> },
  { path: '/smartsales/customers', element: <CustomersPage /> },
  { path: '/smartsales/reports', element: <ReportsPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
