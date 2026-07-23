import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { useForeignOrdersQuery } from '@/entities/foreign-order/model/queries'
import { useSystemStatusQuery } from '@/entities/system/model/queries'
import { getWithdrawalPaidAmountText } from '@/entities/withdrawal/lib/amounts'
import {
  useActiveWithdrawalsQuery,
  useCompletedWithdrawalsQuery,
} from '@/entities/withdrawal/model/queries'
import { CreateWithdrawalForm } from '@/features/create-withdrawal/ui/CreateWithdrawalForm'
import { useWorkspace } from '@/features/workspace/model/useWorkspace'
import {
  markCompletionSoundPlayed,
  playCompletionSound,
  wasCompletionSoundPlayed,
} from '@/shared/lib/completion-sound'
import { getErrorMessage } from '@/shared/lib/errors'
import { Card } from '@/shared/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'
import { ActiveWithdrawals } from '@/widgets/dashboard/ActiveWithdrawals'
import { CompletedWithdrawals } from '@/widgets/dashboard/CompletedWithdrawals'
import { ForeignOrders } from '@/widgets/dashboard/ForeignOrders'
import { OverviewCards } from '@/widgets/dashboard/OverviewCards'

export function DashboardPage() {
  const { selectedWorkspaceId, loading, error } = useWorkspace()
  const activeQuery = useActiveWithdrawalsQuery(selectedWorkspaceId ?? undefined)
  const completedQuery = useCompletedWithdrawalsQuery(selectedWorkspaceId ?? undefined)
  const foreignOrdersQuery = useForeignOrdersQuery(selectedWorkspaceId ?? undefined)
  const systemQuery = useSystemStatusQuery(selectedWorkspaceId ?? undefined)

  useEffect(() => {
    const unseen = (completedQuery.data ?? []).filter(
      (item) => !item.completionSeen && !wasCompletionSoundPlayed(item.publicId),
    )
    if (!unseen.length) return

    unseen.forEach((item) => markCompletionSoundPlayed(item.publicId))
    void playCompletionSound()

    const newest = unseen[0]
    toast.success(`Заявка ${newest.publicId} выполнена`, {
      description: `${getWithdrawalPaidAmountText(newest)} успешно выплачено.`,
      duration: 7_000,
    })
  }, [completedQuery.data])

  if (loading) {
    return (
      <div className="page dashboard-page">
        <Card>
          <LoadingState rows={3} />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page dashboard-page">
        <Card>
          <ErrorState title="Не удалось загрузить workspace" message={getErrorMessage(error)} />
        </Card>
      </div>
    )
  }

  if (!selectedWorkspaceId) {
    return (
      <div className="page dashboard-page">
        <Card>
          <EmptyState
            title="Рабочих пространств пока нет"
            description="Создайте workspace с ключами Bybit и IMAP, чтобы начать создавать заявки."
            action={
              <Link className="button button--primary button--md" to="/workspaces">
                Создать workspace
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="page dashboard-page">
      <div className="dashboard-layout">
        <aside className="dashboard-layout__side">
          <CreateWithdrawalForm workspacePublicId={selectedWorkspaceId} />
        </aside>

        <div className="dashboard-layout__main">
          <OverviewCards system={systemQuery.data} />
          <ActiveWithdrawals
            data={activeQuery.data}
            loading={activeQuery.isLoading}
            error={activeQuery.error}
            onRetry={() => void activeQuery.refetch()}
          />
          <ForeignOrders
            data={foreignOrdersQuery.data}
            loading={foreignOrdersQuery.isLoading}
            error={foreignOrdersQuery.error}
            onRetry={() => void foreignOrdersQuery.refetch()}
          />
          <CompletedWithdrawals
            data={completedQuery.data}
            loading={completedQuery.isLoading}
            error={completedQuery.error}
            onRetry={() => void completedQuery.refetch()}
          />
        </div>
      </div>
    </div>
  )
}
