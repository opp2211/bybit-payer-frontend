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
      <div className="dashboard-layout">
        <aside className="dashboard-layout__side">
          <CreateWithdrawalForm />
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
