import { ArrowUpRight, Ban, ListChecks, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { WithdrawalStatusBadge } from '@/entities/withdrawal/ui/WithdrawalStatusBadge'
import { useCancelWithdrawal } from '@/features/cancel-withdrawal/model/useCancelWithdrawal'
import { getErrorMessage } from '@/shared/lib/errors'
import { compactId, formatDateTime, formatPhone, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

type Props = {
  data?: Withdrawal[]
  loading: boolean
  error: unknown
  onRetry: () => void
}

function getLastActivity(withdrawal: Withdrawal): string {
  const dates = [
    withdrawal.createdAt,
    withdrawal.queuedAt,
    withdrawal.publishedAt,
    withdrawal.orderFoundAt,
    withdrawal.requisitesSentAt,
    withdrawal.paidAt,
    withdrawal.verificationStartedAt,
  ].filter(Boolean) as string[]

  return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
}

export function ActiveWithdrawals({ data = [], loading, error, onRetry }: Props) {
  const [selected, setSelected] = useState<Withdrawal | null>(null)
  const cancelMutation = useCancelWithdrawal()
  const withdrawals = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          Number(b.attentionRequired) - Number(a.attentionRequired) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  )

  const cancelSelected = async () => {
    if (!selected) return

    try {
      await cancelMutation.mutateAsync(selected.id)
      toast.success(`Заявка #${selected.id} отменена`)
      setSelected(null)
    } catch (mutationError) {
      toast.error('Не удалось отменить заявку', {
        description: getErrorMessage(mutationError),
      })
    }
  }

  return (
    <>
      <Card
        title="Активные заявки"
        description="Обновление каждые 2 секунды"
        icon={<ListChecks size={17} />}
        action={<Badge tone="primary">{data.length}</Badge>}
      >
        {loading && !data.length ? (
          <LoadingState rows={4} />
        ) : error && !data.length ? (
          <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
        ) : withdrawals.length === 0 ? (
          <EmptyState
            title="Активных заявок пока нет"
            description="Создайте первую выплату в форме слева."
          />
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Заявка</th>
                  <th>Получатель</th>
                  <th>Статус</th>
                  <th>Контекст</th>
                  <th>Обновлено</th>
                  <th aria-label="Действия" />
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr
                    key={withdrawal.id}
                    className={withdrawal.attentionRequired ? 'data-table__row--attention' : ''}
                  >
                    <td data-label="Заявка">
                      <div className="cell-primary">
                        <strong>{formatRub(withdrawal.amountRub)}</strong>
                        <span>#{withdrawal.id}</span>
                      </div>
                    </td>
                    <td data-label="Получатель">
                      <div className="cell-primary">
                        <strong>{withdrawal.recipientName}</strong>
                        <span>
                          {formatPhone(withdrawal.recipientPhone)} · {withdrawal.recipientBankTitle}
                        </span>
                      </div>
                    </td>
                    <td data-label="Статус">
                      <div className="status-stack">
                        <WithdrawalStatusBadge
                          status={withdrawal.status}
                          title={withdrawal.statusTitle}
                        />
                        {withdrawal.attentionRequired && (
                          <span className="attention-label">
                            <TriangleAlert size={12} /> Требует внимания
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Контекст">
                      <div className="cell-primary">
                        {withdrawal.bybitOrderId ? (
                          <>
                            <span className="mono">Order {compactId(withdrawal.bybitOrderId)}</span>
                            <span>{formatRub(withdrawal.bybitOrderAmountRub)}</span>
                          </>
                        ) : withdrawal.queuePosition ? (
                          <>
                            <span>Позиция в очереди</span>
                            <strong>№ {withdrawal.queuePosition}</strong>
                          </>
                        ) : (
                          <span className="text-muted">Ожидает обработки</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Обновлено">
                      <span className="date-cell">
                        {formatDateTime(getLastActivity(withdrawal))}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {withdrawal.canCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Ban size={15} />}
                            aria-label={`Отменить заявку ${withdrawal.id}`}
                            onClick={() => setSelected(withdrawal)}
                          >
                            <span className="action-label">Отменить</span>
                          </Button>
                        )}
                        <Link
                          className="table-link"
                          to={`/withdrawals/${withdrawal.id}`}
                          aria-label={`Открыть заявку ${withdrawal.id}`}
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(selected)}
        title="Отменить заявку?"
        description={
          <p>
            Заявка <strong>#{selected?.id}</strong> на сумму{' '}
            <strong>{formatRub(selected?.amountRub)}</strong> будет снята с обработки. Backend
            повторно проверит, не появился ли по ней Bybit-ордер.
          </p>
        }
        confirmLabel="Отменить заявку"
        tone="danger"
        loading={cancelMutation.isPending}
        onClose={() => setSelected(null)}
        onConfirm={cancelSelected}
      />
    </>
  )
}
