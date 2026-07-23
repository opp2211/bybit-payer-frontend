import {
  ArrowLeft,
  Ban,
  Bot,
  Check,
  CheckCircle2,
  CircleDot,
  CreditCard,
  FileCheck2,
  FileText,
  Hash,
  Landmark,
  Mail,
  MessageSquareText,
  Phone,
  ReceiptText,
  Send,
  TriangleAlert,
  Unlock,
  UserCheck,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { BybitOrderLink } from '@/entities/bybit-order/ui/BybitOrderLink'
import {
  getWithdrawalAmountCopyValue,
  getWithdrawalAmountText,
} from '@/entities/withdrawal/lib/amounts'
import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { useWithdrawalDetailsQuery } from '@/entities/withdrawal/model/queries'
import {
  getEffectiveWithdrawalMethod,
  getPayerBankTypeTitle,
  getTransferPartyTitle,
  getWithdrawalMethodTitle,
  type AiChatAgent,
  type EmailReceiptCheck,
  type Withdrawal,
  type WithdrawalEvent,
} from '@/entities/withdrawal/model/types'
import { OrderAmounts } from '@/entities/withdrawal/ui/OrderAmounts'
import { WithdrawalStatusBadge } from '@/entities/withdrawal/ui/WithdrawalStatusBadge'
import { useCancelWithdrawal } from '@/features/cancel-withdrawal/model/useCancelWithdrawal'
import {
  useSendChatAgentSuggestion,
  useSetChatAgentMode,
} from '@/features/chat-agent/model/useChatAgentActions'
import { useMarkWithdrawalSeen } from '@/features/mark-withdrawal-seen/model/useMarkWithdrawalSeen'
import { useReleaseWithdrawal } from '@/features/release-withdrawal/model/useReleaseWithdrawal'
import { useSendChatMessage } from '@/features/send-chat-message/model/useSendChatMessage'
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
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { CopyValue } from '@/shared/ui/CopyValue'
import { EmptyState, ErrorState, LoadingState } from '@/shared/ui/QueryState'

const PUBLIC_ID_PATTERN = /^[0-9a-f]{7}$/i

const EVENT_TITLES: Record<string, string> = {
  WITHDRAWAL_CREATED: 'Заявка создана',
  WITHDRAWAL_QUEUED: 'Заявка поставлена в очередь',
  WITHDRAWAL_PUBLISHED: 'Сумма опубликована в объявлении',
  ADVERTISEMENT_UPDATED: 'Объявление Bybit обновлено',
  WITHDRAWAL_REMOVED_FROM_AD: 'Сумма убрана из объявления',
  ORDER_FOUND: 'Ордер Bybit найден',
  AI_CHAT_STARTED: 'ИИ-агент включён',
  AI_CHAT_MESSAGE_SENT: 'ИИ отправил сообщение',
  AI_CHAT_SUGGESTION_CREATED: 'ИИ подготовил подсказку',
  AI_CHAT_DISABLED: 'ИИ-режим выключен',
  AI_CHAT_OPERATOR_REQUIRED: 'ИИ позвал оператора',
  ORDER_CANCELLED: 'Ордер Bybit отменён',
  ORDER_COMPLETED_EXTERNALLY: 'Ордер завершён на стороне Bybit',
  WITHDRAWAL_RETURNED_TO_WORK: 'Заявка возвращена в работу',
  REQUISITES_SENT: 'Реквизиты отправлены в чат',
  CHAT_MESSAGE_SENT: 'Оператор отправил сообщение',
  ORDER_PAID: 'Покупатель отметил оплату',
  MAIL_CHECK_STARTED: 'Начата проверка почты',
  EMAIL_FOUND: 'Письмо с чеком найдено',
  PDF_FOUND: 'PDF-чек найден',
  PDF_PARSED: 'Данные PDF-чека распознаны',
  VERIFICATION_SUCCEEDED: 'Чек успешно проверен',
  VERIFICATION_FAILED: 'Проверка чека не пройдена',
  RELEASE_SUCCEEDED: 'USDT успешно отпущены',
  RELEASE_FAILED: 'Не удалось отпустить USDT',
  MANUAL_RELEASE_SUCCEEDED: 'USDT отпущены вручную',
  ATTENTION_REQUIRED: 'Требуется внимание оператора',
  COMPLETION_SEEN: 'Завершение подтверждено оператором',
  BYBIT_API_ERROR: 'Ошибка Bybit API',
  IMAPS_ERROR: 'Ошибка получения почты',
  PDF_PARSER_ERROR: 'Ошибка чтения PDF-чека',
  WITHDRAWAL_CANCELLED: 'Заявка отменена',
  SYSTEM_RESYNC: 'Система синхронизирована',
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
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

function AiChatAgentPanel({
  agent,
  onSetMode,
  onSendSuggestion,
  modeLoading,
  suggestionLoading,
}: {
  agent: AiChatAgent | null
  onSetMode: (enabled: boolean) => void
  onSendSuggestion: () => void
  modeLoading: boolean
  suggestionLoading: boolean
}) {
  if (!agent?.exists) {
    return null
  }

  const statusTone = agent.operatorRequired ? 'warning' : agent.enabled ? 'success' : 'neutral'
  const statusText = agent.operatorRequired
    ? 'Нужен оператор'
    : agent.enabled
      ? 'ИИ отвечает сам'
      : 'Ручной режим'
  const hasSuggestion = agent.suggestedMessages.length > 0

  return (
    <section className="ai-chat-agent" aria-label="ИИ-агент чата">
      <div className="ai-chat-agent__head">
        <div className="ai-chat-agent__title">
          <span className="ai-chat-agent__icon">
            <Bot size={16} />
          </span>
          <div>
            <strong>ИИ-агент</strong>
            <span>{agent.currentStepTitle || agent.statusTitle || 'Следит за чатом'}</span>
          </div>
        </div>
        <div className="ai-chat-agent__actions">
          <Badge tone={statusTone}>{statusText}</Badge>
          {agent.autoReceiptEnabled && <Badge tone="info">Авточек</Badge>}
          <Button
            type="button"
            size="sm"
            variant={agent.enabled ? 'secondary' : 'primary'}
            icon={<UserCheck size={15} />}
            loading={modeLoading}
            onClick={() => onSetMode(!agent.enabled)}
          >
            {agent.enabled ? 'Взять управление' : 'Включить ИИ'}
          </Button>
        </div>
      </div>

      {agent.lastDecisionSummary && (
        <div className="ai-chat-agent__note">{agent.lastDecisionSummary}</div>
      )}

      {hasSuggestion && (
        <div className="ai-chat-agent__suggestion">
          <div className="ai-chat-agent__suggestion-head">
            <strong>Предложение для отправки</strong>
            {agent.suggestedReason && <span>{agent.suggestedReason}</span>}
          </div>
          <div className="ai-chat-agent__suggestion-messages">
            {agent.suggestedMessages.map((message, index) => (
              <p key={`${index}-${message}`}>{message}</p>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            icon={<Send size={15} />}
            loading={suggestionLoading}
            onClick={onSendSuggestion}
          >
            Отправить предложенное
          </Button>
        </div>
      )}
    </section>
  )
}

function WithdrawalSummary({ withdrawal }: { withdrawal: Withdrawal }) {
  const withdrawalMethod = getEffectiveWithdrawalMethod(withdrawal.withdrawalMethod)

  return (
    <Card title="Данные заявки" icon={<ReceiptText size={17} />}>
      <div className="details-list">
        {withdrawal.recipientName && (
          <DetailRow
            icon={<UserRound size={16} />}
            label="Получатель"
            value={withdrawal.recipientName}
          />
        )}
        <DetailRow
          icon={<Landmark size={16} />}
          label="Банк отправителя"
          value={getPayerBankTypeTitle(withdrawal.payerBankType)}
        />
        <DetailRow
          icon={<CreditCard size={16} />}
          label="Метод вывода"
          value={getWithdrawalMethodTitle(withdrawalMethod)}
        />
        <DetailRow
          icon={<UserRound size={16} />}
          label="Перевод"
          value={getTransferPartyTitle(withdrawal.thirdPartyTransfer)}
        />
        {withdrawalMethod === 'SBP' && (
          <>
            {withdrawal.recipientPhone && (
              <DetailRow
                icon={<Phone size={16} />}
                label="Телефон"
                value={formatPhone(withdrawal.recipientPhone)}
              />
            )}
            {withdrawal.recipientBankTitle && (
              <DetailRow
                icon={<Landmark size={16} />}
                label="Банк получателя"
                value={withdrawal.recipientBankTitle}
              />
            )}
          </>
        )}
        {withdrawalMethod === 'CARD_NUMBER' && withdrawal.recipientCardNumber && (
          <>
            <DetailRow
              icon={<CreditCard size={16} />}
              label="Номер карты"
              value={
                <CopyValue
                  value={withdrawal.recipientCardNumber}
                  successMessage="Номер карты скопирован"
                >
                  {formatCardNumber(withdrawal.recipientCardNumber)}
                </CopyValue>
              }
            />
            <DetailRow
              icon={<Landmark size={16} />}
              label="Карта Т-банка"
              value={withdrawal.recipientCardTbank ? 'Да' : 'Нет'}
            />
          </>
        )}
        {withdrawalMethod === 'ACCOUNT_NUMBER' && withdrawal.recipientAccountNumber && (
          <DetailRow
            icon={<Hash size={16} />}
            label="Номер счета"
            value={
              <CopyValue
                value={withdrawal.recipientAccountNumber}
                successMessage="Номер счета скопирован"
              >
                {formatAccountNumber(withdrawal.recipientAccountNumber)}
              </CopyValue>
            }
          />
        )}
        <DetailRow
          icon={<WalletCards size={16} />}
          label="Bybit order ID"
          value={
            withdrawal.bybitOrderId ? (
              <BybitOrderLink orderId={withdrawal.bybitOrderId} />
            ) : (
              'Не назначен'
            )
          }
        />
        {withdrawal.createdByUsername && (
          <DetailRow
            icon={<UserRound size={16} />}
            label="Создал"
            value={withdrawal.createdByUsername}
          />
        )}
        {withdrawal.bybitOrderAmountRub != null && (
          <DetailRow
            icon={<ReceiptText size={16} />}
            label="Сумма ордера в рублях"
            value={
              <CopyValue
                value={String(withdrawal.bybitOrderAmountRub)}
                successMessage="Сумма ордера скопирована"
              >
                {formatRub(withdrawal.bybitOrderAmountRub)}
              </CopyValue>
            }
          />
        )}
      </div>

      <div className="details-amounts">
        <OrderAmounts withdrawal={withdrawal} />
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

function EventHistory({ events }: { events: WithdrawalEvent[] }) {
  return (
    <Card
      className="history-card"
      title="История обработки"
      description={`${events.length} событий`}
      icon={<CheckCircle2 size={17} />}
    >
      {events.length === 0 ? (
        <EmptyState
          title="История пока пустая"
          description="События появятся по мере обработки заявки."
        />
      ) : (
        <ol className="event-timeline">
          {[...events]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((event, index) => (
              <li key={event.id}>
                <span className={index === 0 ? 'event-marker is-current' : 'event-marker'}>
                  <Check size={12} />
                </span>
                <div className="event-content">
                  <strong>{EVENT_TITLES[event.eventType] || 'Событие обработки'}</strong>
                  <span>
                    {formatDateTime(event.createdAt, true)}
                    {event.actorUsername ? ` · ${event.actorUsername}` : ''}
                  </span>
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
  )
}

export function WithdrawalDetailsPage() {
  const params = useParams()
  const withdrawalPublicId = (params.withdrawalPublicId ?? '').toUpperCase()
  const { selectedWorkspaceId } = useWorkspace()
  const detailsQuery = useWithdrawalDetailsQuery(
    selectedWorkspaceId ?? undefined,
    withdrawalPublicId,
  )
  const cancelMutation = useCancelWithdrawal()
  const markSeenMutation = useMarkWithdrawalSeen()
  const releaseMutation = useReleaseWithdrawal()
  const sendMessageMutation = useSendChatMessage(selectedWorkspaceId ?? '', withdrawalPublicId)
  const setChatAgentModeMutation = useSetChatAgentMode()
  const sendChatAgentSuggestionMutation = useSendChatAgentSuggestion()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [openedReceipt, setOpenedReceipt] = useState<EmailReceiptCheck | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const chatMessages = detailsQuery.data?.chatMessages ?? []
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: 'end' })
  }, [chatMessages.length])

  if (!selectedWorkspaceId) {
    return (
      <div className="page">
        <ErrorState
          title="Workspace не выбран"
          message="Выберите или создайте рабочее пространство перед просмотром заявки."
        />
      </div>
    )
  }

  if (!PUBLIC_ID_PATTERN.test(withdrawalPublicId)) {
    return (
      <div className="page">
        <ErrorState title="Некорректный public ID заявки" message="Проверьте адрес страницы." />
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
          <ArrowLeft size={16} /> К заявкам
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

  const { withdrawal, events, receiptChecks } = detailsQuery.data
  const chatAgent = detailsQuery.data.chatAgent ?? null
  const manualChatLocked =
    Boolean(chatAgent?.exists && chatAgent.enabled) && chatAgent?.status !== 'COMPLETED'

  const cancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId,
      })
      toast.success(`Заявка ${withdrawal.publicId} отменена`)
      setConfirmOpen(false)
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось отменить заявку', { description: getErrorMessage(error) })
    }
  }

  const markSeen = async () => {
    try {
      await markSeenMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId,
      })
      toast.success('Просмотр завершения подтверждён')
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось подтвердить просмотр', { description: getErrorMessage(error) })
    }
  }

  const release = async () => {
    try {
      await releaseMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId,
      })
      toast.success(`Ордер заявки ${withdrawal.publicId} отпущен`)
      setReleaseConfirmOpen(false)
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось отпустить ордер', { description: getErrorMessage(error) })
    }
  }

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const message = messageText.trim()
    if (!message) return

    try {
      await sendMessageMutation.mutateAsync(message)
      setMessageText('')
      toast.success('Сообщение отправлено')
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось отправить сообщение', { description: getErrorMessage(error) })
    }
  }

  const setChatAgentMode = async (enabled: boolean) => {
    try {
      await setChatAgentModeMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId,
        enabled,
      })
      toast.success(enabled ? 'ИИ-режим включён' : 'Чат передан оператору')
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось изменить режим ИИ', { description: getErrorMessage(error) })
    }
  }

  const sendChatAgentSuggestion = async () => {
    try {
      await sendChatAgentSuggestionMutation.mutateAsync({
        workspacePublicId: selectedWorkspaceId,
        withdrawalPublicId,
      })
      toast.success('Подсказка отправлена')
      void detailsQuery.refetch()
    } catch (error) {
      toast.error('Не удалось отправить подсказку', { description: getErrorMessage(error) })
    }
  }

  return (
    <>
      <div className="page withdrawal-details-page">
        <Link className="back-link" to="/">
          <ArrowLeft size={16} /> К заявкам
        </Link>

        <div className="details-hero">
          <div>
            <div className="details-hero__label">
              Заявка <span className="mono">{withdrawal.publicId}</span>
              {withdrawal.attentionRequired && (
                <Badge tone="warning">
                  <TriangleAlert size={13} /> Требует внимания
                </Badge>
              )}
            </div>
            <CopyValue
              className="details-hero__amount"
              value={getWithdrawalAmountCopyValue(withdrawal)}
              successMessage="Сумма заявки скопирована"
            >
              {getWithdrawalAmountText(withdrawal)}
            </CopyValue>
            <div className="details-hero__meta">
              <WithdrawalStatusBadge status={withdrawal.status} title={withdrawal.statusTitle} />
              <span>Создана {formatDateTime(withdrawal.createdAt)}</span>
              {withdrawal.bybitOrderId && (
                <BybitOrderLink orderId={withdrawal.bybitOrderId} compact prefix="Order " />
              )}
            </div>
          </div>

          <div className="details-hero__actions">
            {withdrawal.status === 'COMPLETED' && !withdrawal.completionSeen && (
              <Button
                variant="secondary"
                icon={<Check size={16} />}
                loading={markSeenMutation.isPending}
                onClick={() => void markSeen()}
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
            {withdrawal.canRelease && (
              <Button
                variant="danger"
                icon={<Unlock size={16} />}
                onClick={() => setReleaseConfirmOpen(true)}
              >
                Отпустить ордер
              </Button>
            )}
          </div>
        </div>

        <div className="details-grid">
          <div className="details-column">
            <WithdrawalSummary withdrawal={withdrawal} />

            <Card
              title="Проверка чека"
              description={`${receiptChecks.length} результатов`}
              icon={<FileCheck2 size={17} />}
            >
              {receiptChecks.length === 0 ? (
                <EmptyState
                  title="Проверок пока нет"
                  description="PDF-чек появится после получения письма."
                  icon={<Mail size={21} />}
                />
              ) : (
                <div className="receipt-list">
                  {receiptChecks.map((check) => (
                    <article className="receipt-check" key={check.id}>
                      <button
                        type="button"
                        className="receipt-document"
                        disabled={!check.pdfAvailable}
                        onClick={() => setOpenedReceipt(check)}
                      >
                        <span className="receipt-document__icon">
                          <FileText size={20} />
                        </span>
                        <span>
                          <strong>{check.pdfFilename || 'PDF-чек'}</strong>
                          <small>
                            {check.pdfAvailable ? 'Открыть документ' : 'Файл не сохранён'}
                          </small>
                        </span>
                        <ReceiptStatus check={check} />
                      </button>
                      <div className="receipt-check__grid">
                        <div>
                          <span>Сумма</span>
                          <strong>{formatRub(check.parsedAmountRub)}</strong>
                        </div>
                        <div>
                          <span>Получатель</span>
                          <strong>{check.parsedRecipientName || '-'}</strong>
                        </div>
                        <div>
                          <span>Телефон</span>
                          <strong>
                            {check.parsedRecipientPhone
                              ? formatPhone(check.parsedRecipientPhone)
                              : '-'}
                          </strong>
                        </div>
                        <div>
                          <span>Банк</span>
                          <strong>{check.parsedRecipientBank || '-'}</strong>
                        </div>
                        {check.parsedRecipientCard && (
                          <div>
                            <span>Карта</span>
                            <strong>{check.parsedRecipientCard}</strong>
                          </div>
                        )}
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

          <div className="details-column">
            <EventHistory events={events} />
          </div>

          <div className="details-column details-column--chat">
            <Card
              className="deal-chat"
              title="Чат сделки"
              description={
                withdrawal.bybitOrderId ? 'Синхронизирован с Bybit' : 'Ордер не назначен'
              }
              icon={<MessageSquareText size={17} />}
            >
              <AiChatAgentPanel
                agent={chatAgent}
                modeLoading={setChatAgentModeMutation.isPending}
                suggestionLoading={sendChatAgentSuggestionMutation.isPending}
                onSetMode={(enabled) => void setChatAgentMode(enabled)}
                onSendSuggestion={() => void sendChatAgentSuggestion()}
              />

              <div className="deal-chat__messages">
                {chatMessages.length === 0 ? (
                  <EmptyState
                    title="Сообщений пока нет"
                    description="Переписка появится после привязки Bybit-ордера."
                  />
                ) : (
                  chatMessages.map((message) =>
                    message.direction === 'SYSTEM' ? (
                      <div className="chat-system-message" key={message.id}>
                        <span>{message.messageText}</span>
                        <small>{formatDateTime(message.createdAt, true)}</small>
                      </div>
                    ) : (
                      <article
                        className={`chat-message chat-message--${message.direction.toLowerCase()}`}
                        key={message.id}
                      >
                        <div className="chat-message__author">
                          <strong>{message.authorName}</strong>
                          <span>{formatDateTime(message.createdAt, true)}</span>
                        </div>
                        <p>{message.messageText}</p>
                      </article>
                    ),
                  )
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="deal-chat__composer" onSubmit={(event) => void sendMessage(event)}>
                <textarea
                  value={messageText}
                  maxLength={1000}
                  rows={2}
                  placeholder={
                    manualChatLocked
                      ? 'ИИ-режим включён. Возьмите управление, чтобы написать вручную'
                      : withdrawal.bybitOrderId
                        ? 'Написать контрагенту...'
                        : 'Чат станет доступен после привязки ордера'
                  }
                  disabled={
                    !withdrawal.bybitOrderId || manualChatLocked || sendMessageMutation.isPending
                  }
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                />
                <Button
                  type="submit"
                  icon={<Send size={17} />}
                  loading={sendMessageMutation.isPending}
                  disabled={!withdrawal.bybitOrderId || manualChatLocked || !messageText.trim()}
                >
                  Отправить
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {openedReceipt && (
        <div
          className="pdf-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpenedReceipt(null)
          }}
        >
          <section className="pdf-modal" role="dialog" aria-modal="true" aria-label="Просмотр чека">
            <header>
              <div>
                <strong>{openedReceipt.pdfFilename || 'PDF-чек'}</strong>
                <span>{formatDateTime(openedReceipt.createdAt, true)}</span>
              </div>
              <button type="button" onClick={() => setOpenedReceipt(null)} aria-label="Закрыть">
                <X size={20} />
              </button>
            </header>
            <iframe
              title={openedReceipt.pdfFilename || 'PDF-чек'}
              src={withdrawalApi.getReceiptPdfUrl(
                selectedWorkspaceId,
                withdrawalPublicId,
                openedReceipt.id,
              )}
            />
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Отменить заявку?"
        description={
          <p>
            Backend перепроверит наличие ордера перед отменой заявки{' '}
            <strong>{withdrawal.publicId}</strong>.
          </p>
        }
        confirmLabel="Отменить заявку"
        tone="danger"
        loading={cancelMutation.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={cancel}
      />

      <ConfirmDialog
        open={releaseConfirmOpen}
        title="Отпустить ордер?"
        description={
          <p>
            Контрагент получит USDT. Используйте ручное подтверждение только после проверки оплаты.
          </p>
        }
        confirmLabel="Отпустить ордер"
        tone="danger"
        loading={releaseMutation.isPending}
        onClose={() => setReleaseConfirmOpen(false)}
        onConfirm={release}
      />
    </>
  )
}
