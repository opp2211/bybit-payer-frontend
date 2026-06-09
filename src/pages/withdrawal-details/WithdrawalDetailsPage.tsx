import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  Landmark,
  Mail,
  MessageSquareText,
  Phone,
  ReceiptText,
  TriangleAlert,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import type {
  ChatMessageLog,
  EmailReceiptCheck,
  Withdrawal,
} from '@/entities/withdrawal/model/types'
import { useWithdrawalDetailsQuery } from '@/entities/withdrawal/model/queries'
import { WithdrawalStatusBadge } from '@/entities/withdrawal/ui/WithdrawalStatusBadge'
import { useCancelWithdrawal } from '@/features/cancel-withdrawal/model/useCancelWithdrawal'
import { useMarkWithdrawalSeen } from '@/features/mark-withdrawal-seen/model/useMarkWithdrawalSeen'
import { getErrorMessage } from '@/shared/lib/errors'
import { compactId, formatDateTime, formatPhone, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="detail-row">
      <span className="detail-row__icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function ChatStatus({ message }: { message: ChatMessageLog }) {
  const tone =
    message.status === 'SENT' ? 'success' : message.status === 'FAILED' ? 'danger' : 'warning'
  const label =
    message.status === 'SENT' ? 'Отправлено' : message.status === 'FAILED' ? 'Ошибка' : 'Ожидает'

  return <Badge tone={tone}>{label}</Badge>
}

function ReceiptStatus({ check }: { check: EmailReceiptCheck }) {
  const tone =
    check.verificationStatus === 'VERIFIED'
      ? 'success'
      : check.verificationStatus === 'FAILED'
        ? 'danger'
        : 'warning'
  const label =
    check.verificationStatus === 'VERIFIED'
      ? 'Проверен'
      : check.verificationStatus === 'FAILED'
        ? 'Не прошёл'
        : 'Найден'

  return <Badge tone={tone}>{label}</Badge>
}

function WithdrawalSummary({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <Card title="Данные заявки" icon={<ReceiptText size={17} />}>
      <div className="details-list">
        <DetailRow
          icon={<UserRound size={16} />}
          label="Получатель"
          value={withdrawal.recipientName}
        />
        <DetailRow
          icon={<Phone size={16} />}
          label="Телефон"
          value={formatPhone(withdrawal.recipientPhone)}
        />
        <DetailRow
          icon={<Landmark size={16} />}
          label="Банк"
          value={withdrawal.recipientBankTitle}
        />
        <DetailRow
          icon={<WalletCards size={16} />}
          label="Bybit order ID"
          value={<span className="mono">{withdrawal.bybitOrderId || 'Не назначен'}</span>}
        />
      </div>

      <div className="details-meta">
        <div>
          <span>Создана</span>
          <strong>{formatDateTime(withdrawal.createdAt, true)}</strong>
        </div>
        <div>
          <span>Опубликована</span>
          <strong>{formatDateTime(withdrawal.publishedAt, true)}</strong>
        </div>
        <div>
          <span>Оплата</span>
          <strong>{formatDateTime(withdrawal.paidAt, true)}</strong>
        </div>
        <div>
          <span>Завершена</span>
          <strong>{formatDateTime(withdrawal.completedAt, true)}</strong>
        </div>
      </div>

      {withdrawal.queuePosition && (
        <div className="details-queue">
          <CircleDot size={15} />
          Позиция в очереди: <strong>№ {withdrawal.queuePosition}</strong>
        </div>
      )}

      {(withdrawal.lastError || withdrawal.lastWarning) && (
        <div className={withdrawal.lastError ? 'details-alert is-error' : 'details-alert'}>
          <TriangleAlert size={17} />
          <div>
            <strong>{withdrawal.lastError ? 'Последняя ошибка' : 'Предупреждение'}</strong>
            <span>{withdrawal.lastError || withdrawal.lastWarning}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

export function WithdrawalDetailsPage() {
  const params = useParams()
  const withdrawalId = Number(params.withdrawalId)
  const detailsQuery = useWithdrawalDetailsQuery(withdrawalId)
  const cancelMutation = useCancelWithdrawal()
  const markSeenMutation = useMarkWithdrawalSeen()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!Number.isInteger(withdrawalId) || withdrawalId <= 0) {
    return (
      <div className="page">
        <ErrorState title="Некорректный ID заявки" message="Проверьте адрес страницы." />
      </div>
    )
  }

  if (detailsQuery.isLoading && !detailsQuery.data) {
    return (
      <div className="page details-loading">
        <LoadingState rows={6} />
      </div>
    )
  }

  if (detailsQuery.error && !detailsQuery.data) {
    return (
      <div className="page">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> К рабочей панели
        </Link>
        <Card>
          <ErrorState
            message={getErrorMessage(detailsQuery.error)}
            onRetry={() => void detailsQuery.refetch()}
          />
        </Card>
      </div>
    )
  }

  if (!detailsQuery.data) return null

  const { withdrawal, events, chatMessages, receiptChecks } = detailsQuery.data

  const cancel = async () => {
    try {
      await cancelMutation.mutateAsync(withdrawal.id)
      toast.success(`Заявка #${withdrawal.id} отменена`)
      setConfirmOpen(false)
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось отменить заявку', { description: getErrorMessage(error) })
    }
  }

  const markSeen = async () => {
    try {
      await markSeenMutation.mutateAsync(withdrawal.id)
      toast.success('Просмотр завершения подтверждён')
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось подтвердить просмотр', { description: getErrorMessage(error) })
    }
  }

  return (
    <>
      <div className="page withdrawal-details-page">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> К рабочей панели
        </Link>

        <div className="details-hero">
          <div>
            <div className="details-hero__label">
              Заявка #{withdrawal.id}
              {withdrawal.attentionRequired && (
                <Badge tone="warning">
                  <TriangleAlert size={13} /> Требует внимания
                </Badge>
              )}
            </div>
            <h1>{formatRub(withdrawal.amountRub)}</h1>
            <div className="details-hero__meta">
              <WithdrawalStatusBadge status={withdrawal.status} title={withdrawal.statusTitle} />
              <span>Создана {formatDateTime(withdrawal.createdAt)}</span>
              {withdrawal.bybitOrderId && (
                <span className="mono">Order {compactId(withdrawal.bybitOrderId)}</span>
              )}
            </div>
          </div>

          <div className="details-hero__actions">
            {withdrawal.status === 'COMPLETED' && !withdrawal.completionSeen && (
              <Button
                variant="secondary"
                icon={<Check size={16} />}
                loading={markSeenMutation.isPending}
                onClick={markSeen}
              >
                Увидел
              </Button>
            )}
            {withdrawal.canCancel && (
              <Button
                variant="danger"
                icon={<Ban size={16} />}
                onClick={() => setConfirmOpen(true)}
              >
                Отменить заявку
              </Button>
            )}
          </div>
        </div>

        <div className="details-grid">
          <aside className="details-grid__side">
            <WithdrawalSummary withdrawal={withdrawal} />

            <Card title="Сообщения в чат" icon={<MessageSquareText size={17} />}>
              {chatMessages.length === 0 ? (
                <EmptyState
                  title="Сообщений пока нет"
                  description="Лог появится после привязки Bybit-ордера."
                />
              ) : (
                <div className="chat-list">
                  {chatMessages.map((message) => (
                    <article className="chat-message" key={message.id}>
                      <div className="chat-message__top">
                        <span>Сообщение #{message.messageIndex}</span>
                        <ChatStatus message={message} />
                      </div>
                      <p>{message.messageText}</p>
                      <div className="chat-message__bottom">
                        <span>{formatDateTime(message.sentAt, true)}</span>
                        {message.error && <span className="text-danger">{message.error}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </Card>
          </aside>

          <div className="details-grid__main">
            <Card
              title="История обработки"
              description={`${events.length} событий`}
              icon={<CheckCircle2 size={17} />}
            >
              {events.length === 0 ? (
                <EmptyState
                  title="История пока пуста"
                  description="События появятся по мере обработки заявки."
                />
              ) : (
                <ol className="event-timeline">
                  {[...events]
                    .sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    )
                    .map((event, index) => (
                      <li key={event.id}>
                        <span className={index === 0 ? 'event-marker is-current' : 'event-marker'}>
                          <Check size={12} />
                        </span>
                        <div className="event-content">
                          <div>
                            <strong>{event.message}</strong>
                            <span>{formatDateTime(event.createdAt, true)}</span>
                          </div>
                          <Badge tone="neutral">{event.eventType}</Badge>
                          {event.payloadJson && (
                            <details>
                              <summary>Технические данные</summary>
                              <pre>{event.payloadJson}</pre>
                            </details>
                          )}
                        </div>
                      </li>
                    ))}
                </ol>
              )}
            </Card>

            <Card
              title="Проверка чека"
              description={`${receiptChecks.length} результатов`}
              icon={<FileCheck2 size={17} />}
            >
              {receiptChecks.length === 0 ? (
                <EmptyState
                  title="Проверок пока нет"
                  description="Результат появится после получения PDF-чека по почте."
                  icon={<Mail size={21} />}
                />
              ) : (
                <div className="receipt-list">
                  {receiptChecks.map((check) => (
                    <article className="receipt-check" key={check.id}>
                      <div className="receipt-check__header">
                        <div>
                          <strong>{check.pdfFilename || 'PDF-чек'}</strong>
                          <span>{formatDateTime(check.createdAt, true)}</span>
                        </div>
                        <ReceiptStatus check={check} />
                      </div>
                      <div className="receipt-check__grid">
                        <div>
                          <span>Сумма</span>
                          <strong>{formatRub(check.parsedAmountRub)}</strong>
                        </div>
                        <div>
                          <span>Получатель</span>
                          <strong>{check.parsedRecipientName || '—'}</strong>
                        </div>
                        <div>
                          <span>Телефон</span>
                          <strong>
                            {check.parsedRecipientPhone
                              ? formatPhone(check.parsedRecipientPhone)
                              : '—'}
                          </strong>
                        </div>
                        <div>
                          <span>Банк</span>
                          <strong>{check.parsedRecipientBank || '—'}</strong>
                        </div>
                        <div>
                          <span>Статус операции</span>
                          <strong>{check.parsedStatus || '—'}</strong>
                        </div>
                        <div>
                          <span>ID операции</span>
                          <strong className="mono">{check.parsedOperationId || '—'}</strong>
                        </div>
                      </div>
                      {check.verificationError && (
                        <div className="receipt-check__error">
                          <TriangleAlert size={15} />
                          {check.verificationError}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Отменить заявку?"
        description={
          <p>
            Backend безопасно перепроверит наличие ордера перед отменой заявки{' '}
            <strong>#{withdrawal.id}</strong>.
          </p>
        }
        confirmLabel="Отменить заявку"
        tone="danger"
        loading={cancelMutation.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={cancel}
      />
    </>
  )
}
