import { Activity, CircleAlert, MailCheck, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

import type { SystemStatus } from '@/entities/system/model/types'
import { useResyncSystem } from '@/features/resync-system/model/useResyncSystem'
import { getErrorMessage } from '@/shared/lib/errors'
import { compactId, formatDateTime, formatNumber, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ErrorState, LoadingState } from '@/shared/ui/QueryState'

type Props = {
  data?: SystemStatus
  loading: boolean
  error: unknown
  onRetry: () => void
}

function IntegrationRow({
  label,
  online,
  detail,
}: {
  label: string
  online: boolean
  detail: string
}) {
  return (
    <div className="integration-row">
      <span className={`integration-row__icon ${online ? 'is-online' : 'is-offline'}`}>
        {online ? <Wifi size={15} /> : <WifiOff size={15} />}
      </span>
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <Badge tone={online ? 'success' : 'danger'}>{online ? 'Доступен' : 'Недоступен'}</Badge>
    </div>
  )
}

export function SystemStatusCard({ data, loading, error, onRetry }: Props) {
  const resyncMutation = useResyncSystem()

  const resync = async () => {
    try {
      await resyncMutation.mutateAsync()
      toast.success('Система пересинхронизирована')
    } catch (mutationError) {
      toast.error('Пересинхронизация не выполнена', {
        description: getErrorMessage(mutationError),
      })
    }
  }

  return (
    <Card
      title="Состояние системы"
      description="Интеграции и управляемое объявление"
      icon={<Activity size={17} />}
      action={
        data ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} />}
            aria-label="Синхронизировать систему"
            title="Синхронизировать систему"
            loading={resyncMutation.isPending}
            onClick={resync}
          />
        ) : undefined
      }
    >
      {loading && !data ? (
        <LoadingState rows={3} />
      ) : error && !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
      ) : data ? (
        <div className="system-status">
          <div className="integration-list">
            <IntegrationRow
              label="Bybit API"
              online={data.bybitApiAvailable}
              detail={`Режим: ${data.bybitMode}`}
            />
            <IntegrationRow
              label="Gmail IMAPS"
              online={data.gmailImapsAvailable}
              detail="Проверка чеков по почте"
            />
          </div>

          <div className="system-ad">
            <div className="system-ad__heading">
              <div>
                <span>Объявление Bybit</span>
                <strong className="mono">{compactId(data.bybitAdId)}</strong>
              </div>
              <Badge tone={data.adPublished ? 'success' : 'neutral'}>
                {data.adPublished ? 'Опубликовано' : 'Не опубликовано'}
              </Badge>
            </div>
            <div className="system-stats">
              <div>
                <span>Курс объявления</span>
                <strong>
                  {data.currentRate == null
                    ? '—'
                    : `${formatNumber(data.currentRate)} ₽ · позиция #${data.currentRateSourcePosition ?? '—'}`}
                </strong>
              </div>
              <div>
                <span>Курс 7-й позиции</span>
                <strong>
                  {data.referenceRate7 == null ? '—' : `${formatNumber(data.referenceRate7)} ₽`}
                </strong>
              </div>
              <div>
                <span>7-я позиция с комиссией 0,275%</span>
                <strong>
                  {data.referenceRate7WithFee == null
                    ? '—'
                    : `${formatNumber(data.referenceRate7WithFee)} ₽`}
                </strong>
              </div>
              <div>
                <span>Min / Max</span>
                <strong>
                  {formatRub(data.currentMinRub)} / {formatRub(data.currentMaxRub)}
                </strong>
              </div>
              <div>
                <span>Количество</span>
                <strong>{formatNumber(data.currentQuantityUsdt)} USDT</strong>
              </div>
              <div>
                <span>Баланс USDT</span>
                <strong>{formatNumber(data.availableUsdtBalance)} USDT</strong>
              </div>
              <div>
                <span>Баланс RUB по курсу с комиссией</span>
                <strong>{formatRub(data.availableRubBalance)}</strong>
              </div>
            </div>
            <div className="system-description">
              <Server size={14} />
              <span>{data.currentDescription || 'Текст объявления пока не сформирован'}</span>
            </div>
          </div>

          {data.lastSystemError && (
            <div className="system-error">
              <CircleAlert size={16} />
              <span>{data.lastSystemError}</span>
            </div>
          )}

          <div className="system-status__footer">
            <span>
              <MailCheck size={13} /> Polling активен
            </span>
            <span>Обновлено {formatDateTime(data.lastUpdatedAt)}</span>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
