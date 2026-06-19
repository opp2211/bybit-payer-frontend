import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '@/features/auth/model/useAuth'
import { AuthLoadingScreen } from '@/features/auth/ui/AuthLoadingScreen'
import { LoginPage } from '@/features/auth/ui/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
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
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="withdrawals/:withdrawalId" element={<WithdrawalDetailsPage />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
