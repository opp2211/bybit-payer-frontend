import { Navigate, Route, Routes } from 'react-router-dom'

import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { WithdrawalDetailsPage } from '@/pages/withdrawal-details/WithdrawalDetailsPage'
import { AppShell } from '@/widgets/app-shell/AppShell'

export function App() {
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
