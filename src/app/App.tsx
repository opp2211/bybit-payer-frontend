import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/model/useAuth'
import { WorkspaceProvider } from '@/features/workspace/model/WorkspaceProvider'
import { AuthLoadingScreen } from '@/features/auth/ui/AuthLoadingScreen'
import { LoginPage } from '@/features/auth/ui/LoginPage'
import { AdminBanksPage } from '@/pages/admin-banks/AdminBanksPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { P2pSimulatorPage } from '@/pages/p2p-simulator/P2pSimulatorPage'
import { WorkspacesPage } from '@/pages/workspaces/WorkspacesPage'
import { WithdrawalDetailsPage } from '@/pages/withdrawal-details/WithdrawalDetailsPage'
import { AppShell } from '@/widgets/app-shell/AppShell'

export function App() {
  const { status } = useAuth()
  const location = useLocation()
  const p2pSimulatorRoute = location.pathname === '/p2p-simulator'

  if (status === 'loading') {
    if (p2pSimulatorRoute) {
      return <P2pSimulatorPage />
    }
    return <AuthLoadingScreen />
  }

  if (status === 'anonymous') {
    return (
      <Routes>
        <Route path="p2p-simulator" element={<P2pSimulatorPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="admin/banks" element={<AdminBanksPage />} />
          <Route path="p2p-simulator" element={<P2pSimulatorPage />} />
          <Route path="withdrawals/:withdrawalPublicId" element={<WithdrawalDetailsPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  )
}
