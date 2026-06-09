import { useEffect } from 'react'
import { toast } from 'sonner'

import { useForeignOrdersQuery } from '@/entities/foreign-order/model/queries'
import { useSystemStatusQuery } from '@/entities/system/model/queries'
import {
  useActiveWithdrawalsQuery,
  useCompletedWithdrawalsQuery,
} from '@/entities/withdrawal/model/queries'
import { CreateWithdrawalForm } from '@/features/create-withdrawal/ui/CreateWithdrawalForm'
import {
  markCompletionSoundPlayed,
  playCompletionSound,
  wasCompletionSoundPlayed,
} from '@/shared/lib/completion-sound'
import { formatRub } from '@/shared/lib/formatters'
import { ActiveWithdrawals } from '@/widgets/dashboard/ActiveWithdrawals'
import { CompletedWithdrawals } from '@/widgets/dashboard/CompletedWithdrawals'
import { ForeignOrders } from '@/widgets/dashboard/ForeignOrders'
import { OverviewCards } from '@/widgets/dashboard/OverviewCards'
import { SystemStatusCard } from '@/widgets/dashboard/SystemStatusCard'

export function DashboardPage() {
  const activeQuery = useActiveWithdrawalsQuery()
  const completedQuery = useCompletedWithdrawalsQuery()
  const foreignOrdersQuery = useForeignOrdersQuery()
  const systemQuery = useSystemStatusQuery()

  useEffect(() => {
    const unseen = (completedQuery.data ?? []).filter(
      (item) => !item.completionSeen && !wasCompletionSoundPlayed(item.id),
    )
    if (!unseen.length) return

    unseen.forEach((item) => markCompletionSoundPlayed(item.id))
    void playCompletionSound()

    const newest = unseen[0]
    toast.success(`Заявка #${newest.id} выполнена`, {
      description: `${formatRub(newest.amountRub)} успешно выплачено.`,
      duration: 7_000,
    })
  }, [completedQuery.data])

  return (
    <div className="page dashboard-page">
      <div className="page-heading">
        <div>
          <div className="page-heading__eyebrow">Рабочая панель</div>
          <h1>Управление выплатами</h1>
          <p>Создавайте заявки и контролируйте весь цикл обработки в одном месте.</p>
        </div>
      </div>

      <OverviewCards
        active={activeQuery.data ?? []}
        foreignOrders={foreignOrdersQuery.data ?? []}
        system={systemQuery.data}
      />

      <div className="dashboard-layout">
        <aside className="dashboard-layout__side">
          <CreateWithdrawalForm />
          <SystemStatusCard
            data={systemQuery.data}
            loading={systemQuery.isLoading}
            error={systemQuery.error}
            onRetry={() => void systemQuery.refetch()}
          />
        </aside>

        <div className="dashboard-layout__main">
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
