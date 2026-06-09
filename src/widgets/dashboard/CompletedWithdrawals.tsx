import { ArrowUpRight, Check, CheckCircle2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { useMarkWithdrawalSeen } from '@/features/mark-withdrawal-seen/model/useMarkWithdrawalSeen'
import { getErrorMessage } from '@/shared/lib/errors'
import { compactId, formatDateTime, formatPhone, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

type Props = {
  data?: Withdrawal[]
  loading: boolean
  error: unknown
  onRetry: () => void
}

export function CompletedWithdrawals({ data = [], loading, error, onRetry }: Props) {
  const markSeenMutation = useMarkWithdrawalSeen()
  const unseenCount = data.filter((item) => !item.completionSeen).length
  const withdrawals = [...data].sort(
    (a, b) =>
      Number(a.completionSeen) - Number(b.completionSeen) ||
      new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
  )

  const markSeen = async (withdrawal: Withdrawal) => {
    try {
      await markSeenMutation.mutateAsync(withdrawal.id)
      toast.success(`Завершение заявки #${withdrawal.id} подтверждено`)
    } catch (mutationError) {
      toast.error('Не удалось подтвердить просмотр', {
        description: getErrorMessage(mutationError),
      })
    }
  }

  return (
    <Card
      title="Выполненные заявки"
      description="Обновление каждые 5 секунд"
      icon={<CheckCircle2 size={17} />}
      action={unseenCount > 0 ? <Badge tone="success">{unseenCount} новых</Badge> : undefined}
    >
      {loading && !data.length ? (
        <LoadingState rows={3} />
      ) : error && !data.length ? (
        <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
      ) : withdrawals.length === 0 ? (
        <EmptyState
          title="Завершённых заявок пока нет"
          description="После успешной проверки чека заявка появится здесь."
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table data-table--completed">
            <thead>
              <tr>
                <th>Заявка</th>
                <th>Получатель</th>
                <th>Bybit order</th>
                <th>Завершена</th>
                <th>Подтверждение</th>
                <th aria-label="Открыть" />
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className={!withdrawal.completionSeen ? 'new-row' : ''}>
                  <td data-label="Заявка">
                    <div className="cell-primary">
                      <strong>{formatRub(withdrawal.amountRub)}</strong>
                      <span>#{withdrawal.id}</span>
                    </div>
                  </td>
                  <td data-label="Получатель">
                    <div className="cell-primary">
                      <strong>{withdrawal.recipientName}</strong>
                      <span>{formatPhone(withdrawal.recipientPhone)}</span>
                    </div>
                  </td>
                  <td data-label="Bybit order">
                    <span className="mono">{compactId(withdrawal.bybitOrderId)}</span>
                  </td>
                  <td data-label="Завершена">
                    <span className="date-cell">{formatDateTime(withdrawal.completedAt)}</span>
                  </td>
                  <td data-label="Подтверждение">
                    {!withdrawal.completionSeen ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Sparkles size={14} />}
                        loading={
                          markSeenMutation.isPending && markSeenMutation.variables === withdrawal.id
                        }
                        onClick={() => markSeen(withdrawal)}
                      >
                        Увидел
                      </Button>
                    ) : (
                      <span className="seen-label">
                        <Check size={14} /> Просмотрено
                      </span>
                    )}
                  </td>
                  <td>
                    <Link
                      className="table-link"
                      to={`/withdrawals/${withdrawal.id}`}
                      aria-label={`Открыть заявку ${withdrawal.id}`}
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
