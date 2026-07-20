import { Ban, ListChecks, TriangleAlert, Unlock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { BybitOrderLink } from '@/entities/bybit-order/ui/BybitOrderLink'
import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { OrderAmounts } from '@/entities/withdrawal/ui/OrderAmounts'
import { WithdrawalStatusBadge } from '@/entities/withdrawal/ui/WithdrawalStatusBadge'
import { useCancelWithdrawal } from '@/features/cancel-withdrawal/model/useCancelWithdrawal'
import { useReleaseWithdrawal } from '@/features/release-withdrawal/model/useReleaseWithdrawal'
import { useWorkspace } from '@/features/workspace/model/useWorkspace'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatDateTime, formatPhone, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { CopyValue } from '@/shared/ui/CopyValue'
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
  const { selectedWorkspaceId } = useWorkspace()
  const [selectedForCancel, setSelectedForCancel] = useState<Withdrawal | null>(null)
  const [selectedForRelease, setSelectedForRelease] = useState<Withdrawal | null>(null)
  const cancelMutation = useCancelWithdrawal()
  const releaseMutation = useReleaseWithdrawal()
  const navigate = useNavigate()
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
    if (!selectedForCancel || !selectedWorkspaceId) return

    try {
      await cancelMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId: selectedForCancel.publicId,
      })
      toast.success(`Заявка ${selectedForCancel.publicId} отменена`)
      setSelectedForCancel(null)
    } catch (mutationError) {
      toast.error('Не удалось отменить заявку', {
        description: getErrorMessage(mutationError),
      })
    }
  }

  const releaseSelected = async () => {
    if (!selectedForRelease || !selectedWorkspaceId) return

    try {
      await releaseMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId: selectedForRelease.publicId,
      })
      toast.success(`Ордер заявки ${selectedForRelease.publicId} отпущен`)
      setSelectedForRelease(null)
    } catch (mutationError) {
      toast.error('Не удалось отпустить ордер', {
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
                    key={withdrawal.publicId}
                    className={withdrawal.attentionRequired ? 'data-table__row--attention' : ''}
                    role="link"
                    tabIndex={0}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest('button, a')) return
                      navigate(`/withdrawals/${withdrawal.publicId}`)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/withdrawals/${withdrawal.publicId}`)
                    }}
                  >
                    <td data-label="Заявка">
                      <div className="cell-primary">
                        <CopyValue
                          className="withdrawal-amount-copy"
                          value={String(withdrawal.amountRub)}
                          successMessage="Сумма заявки скопирована"
                        >
                          {formatRub(withdrawal.amountRub)}
                        </CopyValue>
                        <span className="mono">{withdrawal.publicId}</span>
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
                            <BybitOrderLink
                              orderId={withdrawal.bybitOrderId}
                              compact
                              prefix="Order "
                            />
                            {withdrawal.bybitOrderAmountRub != null && (
                              <CopyValue
                                value={String(withdrawal.bybitOrderAmountRub)}
                                successMessage="Сумма ордера скопирована"
                              >
                                {formatRub(withdrawal.bybitOrderAmountRub)}
                              </CopyValue>
                            )}
                            <OrderAmounts withdrawal={withdrawal} compact />
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
                            aria-label={`Отменить заявку ${withdrawal.publicId}`}
                            onClick={() => setSelectedForCancel(withdrawal)}
                          >
                            <span className="action-label">Отменить</span>
                          </Button>
                        )}
                        {withdrawal.canRelease && (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Unlock size={15} />}
                            aria-label={`Отпустить ордер заявки ${withdrawal.publicId}`}
                            onClick={() => setSelectedForRelease(withdrawal)}
                          >
                            <span className="action-label">Отпустить ордер</span>
                          </Button>
                        )}
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
        open={Boolean(selectedForCancel)}
        title="Отменить заявку?"
        description={
          <p>
            Заявка <strong>{selectedForCancel?.publicId}</strong> на сумму{' '}
            <strong>{formatRub(selectedForCancel?.amountRub)}</strong> будет снята с обработки.
            Backend повторно проверит, не появился ли по ней Bybit-ордер.
          </p>
        }
        confirmLabel="Отменить заявку"
        tone="danger"
        loading={cancelMutation.isPending}
        onClose={() => setSelectedForCancel(null)}
        onConfirm={cancelSelected}
      />

      <ConfirmDialog
        open={Boolean(selectedForRelease)}
        title="Отпустить ордер?"
        description={
          <p>
            Система не смогла проверить оплату по чеку с почты. Используйте ручное подтверждение
            только после проверки оплаты.
          </p>
        }
        confirmLabel="Отпустить ордер"
        tone="danger"
        loading={releaseMutation.isPending}
        onClose={() => setSelectedForRelease(null)}
        onConfirm={releaseSelected}
      />
    </>
  )
}
