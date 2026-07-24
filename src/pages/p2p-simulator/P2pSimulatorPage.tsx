import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import {
  Ban,
  CheckCircle2,
  CircleDollarSign,
  MessageSquareText,
  RefreshCw,
  Send,
  Store,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { p2pSimulatorApi } from '@/entities/p2p-simulator/api/p2p-simulator-api'
import {
  p2pSimulatorKeys,
  useFakeBybitActiveOrdersQuery,
  useFakeBybitAdsQuery,
  useFakeBybitOrderQuery,
} from '@/entities/p2p-simulator/model/queries'
import type { FakeBybitAd, FakeBybitOrder } from '@/entities/p2p-simulator/model/types'
import { getErrorMessage } from '@/shared/lib/errors'
import { formatDateTime, formatNumber, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

function statusTone(status: string) {
  if (status === '20') return 'warning'
  if (status === '40') return 'danger'
  if (status === '50') return 'success'
  return 'info'
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function adRangeText(ad: FakeBybitAd) {
  return `${formatRub(ad.minRub)} - ${formatRub(ad.maxRub)}`
}

function AdList({
  ads,
  amounts,
  creatingAdId,
  onAmountChange,
  onCreateOrder,
}: {
  ads: FakeBybitAd[]
  amounts: Record<string, string>
  creatingAdId: string | null
  onAmountChange: (bybitAdId: string, value: string) => void
  onCreateOrder: (ad: FakeBybitAd) => void
}) {
  return (
    <div className="simulator-ad-list">
      {ads.map((ad) => (
        <article className="simulator-ad" key={ad.bybitAdId}>
          <div className="simulator-ad__main">
            <div className="simulator-ad__title">
              <strong className="mono">{ad.bybitAdId}</strong>
              <Badge tone="success">Опубликовано</Badge>
            </div>
            <div className="simulator-ad__workspace">
              {ad.workspaceName || 'Workspace не найден'}
              {ad.workspacePublicId && <span className="mono">{ad.workspacePublicId}</span>}
            </div>
            <p>{ad.description || 'Описание объявления пустое'}</p>
          </div>

          <div className="simulator-ad__metrics">
            <div>
              <span>Курс</span>
              <strong>{formatNumber(ad.rate)}</strong>
            </div>
            <div>
              <span>Диапазон</span>
              <strong>{adRangeText(ad)}</strong>
            </div>
            <div>
              <span>Количество</span>
              <strong>{formatNumber(ad.quantityUsdt)} USDT</strong>
            </div>
            <div>
              <span>Ордера</span>
              <strong>{ad.activeOrderCount}</strong>
            </div>
          </div>

          <form
            className="simulator-ad__order-form"
            onSubmit={(event) => {
              event.preventDefault()
              onCreateOrder(ad)
            }}
          >
            <label>
              <span>Сумма ордера</span>
              <input
                type="number"
                min={ad.minRub ?? undefined}
                max={ad.maxRub ?? undefined}
                step="0.01"
                value={amounts[ad.bybitAdId] ?? ''}
                placeholder="0"
                onChange={(event) => onAmountChange(ad.bybitAdId, event.target.value)}
              />
            </label>
            <Button
              type="submit"
              icon={<CircleDollarSign size={16} />}
              loading={creatingAdId === ad.bybitAdId}
            >
              Создать ордер
            </Button>
          </form>
        </article>
      ))}
    </div>
  )
}

function OrderList({
  orders,
  selectedOrderId,
  onSelect,
}: {
  orders: FakeBybitOrder[]
  selectedOrderId: string | null
  onSelect: (bybitOrderId: string) => void
}) {
  return (
    <div className="simulator-order-list">
      {orders.map((order) => (
        <button
          type="button"
          key={order.bybitOrderId}
          className={clsx(
            'simulator-order-row',
            order.bybitOrderId === selectedOrderId && 'is-active',
          )}
          onClick={() => onSelect(order.bybitOrderId)}
        >
          <span>
            <strong className="mono">{order.bybitOrderId}</strong>
            <small>{formatRub(order.amountRub)}</small>
          </span>
          <Badge tone={statusTone(order.status)}>{order.statusTitle}</Badge>
        </button>
      ))}
    </div>
  )
}

function OrderDetails({
  order,
  messageText,
  actionLoading,
  messageLoading,
  onMessageChange,
  onSendMessage,
  onMarkPaid,
  onCancel,
}: {
  order: FakeBybitOrder
  messageText: string
  actionLoading: boolean
  messageLoading: boolean
  onMessageChange: (value: string) => void
  onSendMessage: (event: FormEvent) => void
  onMarkPaid: () => void
  onCancel: () => void
}) {
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'end' })
  }, [order.chatMessages.length])

  const active = order.status === '10' || order.status === '20'
  const canMarkPaid = order.status === '10'

  return (
    <Card
      className="simulator-order-details"
      title={`Ордер ${order.bybitOrderId}`}
      description={`Объявление ${order.bybitAdId}`}
      icon={<WalletCards size={17} />}
      action={<Badge tone={statusTone(order.status)}>{order.statusTitle}</Badge>}
    >
      <div className="simulator-order-facts">
        <div>
          <span>Сумма</span>
          <strong>{formatRub(order.amountRub)}</strong>
        </div>
        <div>
          <span>USDT</span>
          <strong>{formatNumber(order.quantityUsdt)}</strong>
        </div>
        <div>
          <span>Комиссия</span>
          <strong>{formatNumber(order.feeUsdt)}</strong>
        </div>
        <div>
          <span>Создан</span>
          <strong>{formatDateTime(order.createdAt)}</strong>
        </div>
      </div>

      <div className="simulator-order-actions">
        <Button
          type="button"
          variant="secondary"
          icon={<CheckCircle2 size={16} />}
          disabled={!canMarkPaid}
          loading={actionLoading && canMarkPaid}
          onClick={onMarkPaid}
        >
          Оплачено
        </Button>
        <Button
          type="button"
          variant="danger"
          icon={<Ban size={16} />}
          disabled={!active}
          loading={actionLoading && active}
          onClick={onCancel}
        >
          Отменить
        </Button>
      </div>

      <section className="simulator-chat" aria-label="Чат fake-ордера">
        <div className="simulator-chat__head">
          <MessageSquareText size={16} />
          <strong>Чат сделки</strong>
        </div>

        <div className="simulator-chat__messages">
          {order.chatMessages.length === 0 ? (
            <EmptyState title="Сообщений нет" description="Здесь появится переписка по ордеру." />
          ) : (
            order.chatMessages.map((message) => (
              <article
                key={message.id}
                className={`simulator-message simulator-message--${message.direction.toLowerCase()}`}
              >
                <div>
                  <strong>{message.authorName}</strong>
                  <span>{formatDateTime(message.createdAt, true)}</span>
                </div>
                <p>{message.message}</p>
              </article>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <form className="simulator-chat__composer" onSubmit={onSendMessage}>
          <textarea
            value={messageText}
            rows={2}
            maxLength={1000}
            placeholder={active ? 'Сообщение от Fake Buyer...' : 'Ордер уже не активен'}
            disabled={!active || messageLoading}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <Button
            type="submit"
            icon={<Send size={16} />}
            disabled={!active || !messageText.trim()}
            loading={messageLoading}
          >
            Отправить
          </Button>
        </form>
      </section>
    </Card>
  )
}

export function P2pSimulatorPage() {
  const queryClient = useQueryClient()
  const adsQuery = useFakeBybitAdsQuery()
  const ordersQuery = useFakeBybitActiveOrdersQuery()
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const activeOrders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data])
  const effectiveSelectedOrderId = selectedOrderId ?? activeOrders[0]?.bybitOrderId ?? null
  const orderQuery = useFakeBybitOrderQuery(effectiveSelectedOrderId)

  const invalidateSimulator = async (orderId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: p2pSimulatorKeys.ads() }),
      queryClient.invalidateQueries({ queryKey: p2pSimulatorKeys.activeOrders() }),
      orderId
        ? queryClient.invalidateQueries({ queryKey: p2pSimulatorKeys.order(orderId) })
        : Promise.resolve(),
    ])
  }

  const createOrderMutation = useMutation({
    mutationFn: ({ bybitAdId, amountRub }: { bybitAdId: string; amountRub: number }) =>
      p2pSimulatorApi.createOrder(bybitAdId, amountRub),
    onSuccess: async (order) => {
      setSelectedOrderId(order.bybitOrderId)
      setAmounts((current) => ({ ...current, [order.bybitAdId]: '' }))
      queryClient.setQueryData(p2pSimulatorKeys.order(order.bybitOrderId), order)
      await invalidateSimulator(order.bybitOrderId)
      toast.success(`Ордер ${order.bybitOrderId} создан`)
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ bybitOrderId, message }: { bybitOrderId: string; message: string }) =>
      p2pSimulatorApi.sendMessage(bybitOrderId, message),
    onSuccess: async (order) => {
      setMessageText('')
      queryClient.setQueryData(p2pSimulatorKeys.order(order.bybitOrderId), order)
      await invalidateSimulator(order.bybitOrderId)
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: p2pSimulatorApi.markPaid,
    onSuccess: async (order) => {
      queryClient.setQueryData(p2pSimulatorKeys.order(order.bybitOrderId), order)
      await invalidateSimulator(order.bybitOrderId)
      toast.success(`Ордер ${order.bybitOrderId} отмечен оплаченным`)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: p2pSimulatorApi.cancel,
    onSuccess: async (order) => {
      queryClient.setQueryData(p2pSimulatorKeys.order(order.bybitOrderId), order)
      await invalidateSimulator(order.bybitOrderId)
      toast.success(`Ордер ${order.bybitOrderId} отменён`)
    },
  })

  const setAmount = (bybitAdId: string, value: string) => {
    setAmounts((current) => ({ ...current, [bybitAdId]: value }))
  }

  const createOrder = async (ad: FakeBybitAd) => {
    const amount = parseAmount(amounts[ad.bybitAdId] ?? '')
    if (amount == null) {
      toast.error('Введите сумму ордера')
      return
    }
    if (ad.minRub != null && amount < ad.minRub) {
      toast.error(`Минимальная сумма ${formatRub(ad.minRub)}`)
      return
    }
    if (ad.maxRub != null && amount > ad.maxRub) {
      toast.error(`Максимальная сумма ${formatRub(ad.maxRub)}`)
      return
    }

    try {
      await createOrderMutation.mutateAsync({ bybitAdId: ad.bybitAdId, amountRub: amount })
    } catch (error) {
      toast.error('Не удалось создать ордер', { description: getErrorMessage(error) })
    }
  }

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const message = messageText.trim()
    if (!effectiveSelectedOrderId || !message) return

    try {
      await sendMessageMutation.mutateAsync({ bybitOrderId: effectiveSelectedOrderId, message })
    } catch (error) {
      toast.error('Не удалось отправить сообщение', { description: getErrorMessage(error) })
    }
  }

  const markPaid = async () => {
    if (!effectiveSelectedOrderId) return
    try {
      await markPaidMutation.mutateAsync(effectiveSelectedOrderId)
    } catch (error) {
      toast.error('Не удалось отметить оплату', { description: getErrorMessage(error) })
    }
  }

  const cancel = async () => {
    if (!effectiveSelectedOrderId) return
    try {
      await cancelMutation.mutateAsync(effectiveSelectedOrderId)
    } catch (error) {
      toast.error('Не удалось отменить ордер', { description: getErrorMessage(error) })
    }
  }

  const refresh = async () => {
    await Promise.all([adsQuery.refetch(), ordersQuery.refetch(), orderQuery.refetch()])
  }

  return (
    <div className="page p2p-simulator-page">
      <div className="page-heading">
        <div>
          <span className="page-heading__eyebrow">Local Bybit</span>
          <h1>P2P-симулятор</h1>
          <p>Опубликованные объявления и активные fake-ордера локального профиля.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          icon={<RefreshCw size={16} />}
          onClick={() => void refresh()}
        >
          Обновить
        </Button>
      </div>

      <Card
        className="simulator-ads-card"
        title="Витрина объявлений"
        description={`${adsQuery.data?.length ?? 0} опубликовано`}
        icon={<Store size={17} />}
      >
        {adsQuery.isLoading && !adsQuery.data ? (
          <LoadingState rows={4} />
        ) : adsQuery.error && !adsQuery.data ? (
          <ErrorState
            message={getErrorMessage(adsQuery.error)}
            onRetry={() => void adsQuery.refetch()}
          />
        ) : (adsQuery.data ?? []).length === 0 ? (
          <EmptyState
            title="Опубликованных объявлений нет"
            description="Создайте заявку и дождитесь публикации managed ad."
          />
        ) : (
          <AdList
            ads={adsQuery.data ?? []}
            amounts={amounts}
            creatingAdId={
              createOrderMutation.isPending
                ? (createOrderMutation.variables?.bybitAdId ?? null)
                : null
            }
            onAmountChange={setAmount}
            onCreateOrder={(ad) => void createOrder(ad)}
          />
        )}
      </Card>

      <div className="simulator-workbench">
        <Card
          className="simulator-orders-card"
          title="Активные ордера"
          description={`${activeOrders.length} в fake Bybit`}
          icon={<WalletCards size={17} />}
        >
          {ordersQuery.isLoading && !ordersQuery.data ? (
            <LoadingState rows={4} />
          ) : ordersQuery.error && !ordersQuery.data ? (
            <ErrorState
              message={getErrorMessage(ordersQuery.error)}
              onRetry={() => void ordersQuery.refetch()}
            />
          ) : activeOrders.length === 0 ? (
            <EmptyState title="Активных ордеров нет" description="Создайте ордер из объявления." />
          ) : (
            <OrderList
              orders={activeOrders}
              selectedOrderId={effectiveSelectedOrderId}
              onSelect={setSelectedOrderId}
            />
          )}
        </Card>

        {orderQuery.isLoading && !orderQuery.data ? (
          <Card className="simulator-order-details">
            <LoadingState rows={6} />
          </Card>
        ) : orderQuery.error && !orderQuery.data ? (
          <Card className="simulator-order-details">
            <ErrorState
              message={getErrorMessage(orderQuery.error)}
              onRetry={() => void orderQuery.refetch()}
            />
          </Card>
        ) : orderQuery.data ? (
          <OrderDetails
            order={orderQuery.data}
            messageText={messageText}
            actionLoading={markPaidMutation.isPending || cancelMutation.isPending}
            messageLoading={sendMessageMutation.isPending}
            onMessageChange={setMessageText}
            onSendMessage={(event) => void sendMessage(event)}
            onMarkPaid={() => void markPaid()}
            onCancel={() => void cancel()}
          />
        ) : (
          <Card className="simulator-order-details" title="Ордер" icon={<WalletCards size={17} />}>
            <EmptyState title="Ордер не выбран" description="Выберите активный ордер слева." />
          </Card>
        )}
      </div>
    </div>
  )
}
