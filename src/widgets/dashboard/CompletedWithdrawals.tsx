import { Check, CheckCircle2, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { BybitOrderLink } from '@/entities/bybit-order/ui/BybitOrderLink'
import {
  getPayerBankTypeTitle,
  getWithdrawalMethodTitle,
  type Withdrawal,
} from '@/entities/withdrawal/model/types'
import { OrderAmounts } from '@/entities/withdrawal/ui/OrderAmounts'
import { useMarkWithdrawalSeen } from '@/features/mark-withdrawal-seen/model/useMarkWithdrawalSeen'
import { useWorkspace } from '@/features/workspace/model/useWorkspace'
import { getErrorMessage } from '@/shared/lib/errors'
import {
  formatAccountNumber,
  formatCardNumber,
  formatDateTime,
  formatPhone,
  formatRub,
} from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { CopyValue } from '@/shared/ui/CopyValue'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

type Props = {
  data?: Withdrawal[]
  loading: boolean
  error: unknown
  onRetry: () => void
}

function getRecipientTitle(withdrawal: Withdrawal): string {
  return withdrawal.recipientName ?? (
    withdrawal.withdrawalMethod === 'CARD_NUMBER' ? 'Карта получателя' : 'Получатель'
  )
}

function getRecipientRequisites(withdrawal: Withdrawal): string {
  if (withdrawal.withdrawalMethod === 'SBP') {
    return withdrawal.recipientPhone ? formatPhone(withdrawal.recipientPhone) : '—'
  }
  if (withdrawal.withdrawalMethod === 'CARD_NUMBER') {
    return formatCardNumber(withdrawal.recipientCardNumber)
  }
  return formatAccountNumber(withdrawal.recipientAccountNumber)
}

function getPaymentContext(withdrawal: Withdrawal): string {
  return [
    getPayerBankTypeTitle(withdrawal.payerBankType),
    getWithdrawalMethodTitle(withdrawal.withdrawalMethod),
    withdrawal.thirdPartyTransfer ? '3 лицо' : 'личная / жена',
  ].join(' · ')
}

export function CompletedWithdrawals({ data = [], loading, error, onRetry }: Props) {
  const { selectedWorkspaceId } = useWorkspace()
  const markSeenMutation = useMarkWithdrawalSeen()
  const navigate = useNavigate()
  const unseenCount = data.filter((item) => !item.completionSeen).length
  const withdrawals = [...data].sort(
    (a, b) =>
      Number(a.completionSeen) - Number(b.completionSeen) ||
      new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
  )

  const markSeen = async (withdrawal: Withdrawal) => {
    if (!selectedWorkspaceId) return

    try {
      await markSeenMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId: withdrawal.publicId,
      })
      toast.success(`Завершение заявки ${withdrawal.publicId} подтверждено`)
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
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr
                  key={withdrawal.publicId}
                  className={!withdrawal.completionSeen ? 'new-row' : ''}
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
                      <strong>{getRecipientTitle(withdrawal)}</strong>
                      <span>{getRecipientRequisites(withdrawal)}</span>
                      <span className="text-muted">{getPaymentContext(withdrawal)}</span>
                    </div>
                  </td>
                  <td data-label="Bybit order">
                    <div className="cell-primary">
                      {withdrawal.bybitOrderId ? (
                        <BybitOrderLink orderId={withdrawal.bybitOrderId} compact />
                      ) : (
                        <span>Не назначен</span>
                      )}
                      <OrderAmounts withdrawal={withdrawal} compact />
                    </div>
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
                          markSeenMutation.isPending &&
                          markSeenMutation.variables?.withdrawalPublicId === withdrawal.publicId
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
