import { ShieldAlert, TriangleAlert } from 'lucide-react'

import type { ForeignBybitOrder } from '@/entities/foreign-order/model/types'
import { getErrorMessage } from '@/shared/lib/errors'
import { compactId, formatDateTime, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Card } from '@/shared/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

type Props = {
  data?: ForeignBybitOrder[]
  loading: boolean
  error: unknown
  onRetry: () => void
}

export function ForeignOrders({ data = [], loading, error, onRetry }: Props) {
  return (
    <Card
      title="Чужие ордера"
      description="Ордера, которые нельзя безопасно сопоставить"
      icon={<ShieldAlert size={17} />}
      action={data.length > 0 ? <Badge tone="danger">{data.length}</Badge> : undefined}
    >
      {loading && !data.length ? (
        <LoadingState rows={2} />
      ) : error && !data.length ? (
        <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
      ) : data.length === 0 ? (
        <EmptyState
          title="Чужих ордеров не обнаружено"
          description="Все входящие ордера корректно сопоставлены с заявками."
          icon={<ShieldAlert size={21} />}
        />
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bybit order</th>
                <th>Сумма</th>
                <th>Причина</th>
                <th>Отмена</th>
                <th>Обновлено</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr key={order.id} className={order.attentionRequired ? 'foreign-row' : ''}>
                  <td data-label="Bybit order">
                    <div className="cell-primary">
                      <strong className="mono">{compactId(order.bybitOrderId)}</strong>
                      <span>{order.bybitStatus || 'Статус неизвестен'}</span>
                    </div>
                  </td>
                  <td data-label="Сумма">
                    <strong>{formatRub(order.amountRub)}</strong>
                  </td>
                  <td data-label="Причина">
                    <div className="reason-cell">
                      {order.attentionRequired && <TriangleAlert size={14} />}
                      <span>{order.reason}</span>
                    </div>
                    {order.lastError && <span className="inline-error">{order.lastError}</span>}
                  </td>
                  <td data-label="Отмена">
                    <div className="cell-primary">
                      <Badge tone={order.cancelRequested ? 'warning' : 'neutral'}>
                        {order.cancelRequested ? 'Запрошена' : 'Не запрошена'}
                      </Badge>
                      <span>Попыток: {order.cancelRequestAttempts}</span>
                    </div>
                  </td>
                  <td data-label="Обновлено">
                    <span className="date-cell">{formatDateTime(order.updatedAt)}</span>
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
