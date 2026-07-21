import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '@/features/auth/model/useAuth'
import { WorkspaceProvider } from '@/features/workspace/model/WorkspaceProvider'
import { AuthLoadingScreen } from '@/features/auth/ui/AuthLoadingScreen'
import { LoginPage } from '@/features/auth/ui/LoginPage'
import { AdminBanksPage } from '@/pages/admin-banks/AdminBanksPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { WorkspacesPage } from '@/pages/workspaces/WorkspacesPage'
import { WithdrawalDetailsPage } from '@/pages/withdrawal-details/WithdrawalDetailsPage'
import { AppShell } from '@/widgets/app-shell/AppShell'

export function App() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <AuthLoadingScreen />
  }

  if (status === 'anonymous') {
    return <LoginPage />
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="admin/banks" element={<AdminBanksPage />} />
          <Route path="withdrawals/:withdrawalPublicId" element={<WithdrawalDetailsPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </WorkspaceProvider>
  )
}
