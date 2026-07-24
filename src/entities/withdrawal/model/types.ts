export type WithdrawalStatus =
  | 'NEW'
  | 'QUEUED'
  | 'IN_WORK'
  | 'PAYMENT_IN_PROGRESS'
  | 'PAYMENT_VERIFICATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ERROR'

export type RecipientBank = string

export type WithdrawalAmountMode = 'FIXED' | 'RANGE'
export type PayerBankType = 'TBANK_AUTO' | 'SBERBANK' | 'ANY_BANK'
export type WithdrawalMethod = 'SBP' | 'CARD_NUMBER' | 'ACCOUNT_NUMBER'

export const payerBankTypeLabels = {
  TBANK_AUTO: 'Т-банк (авто)',
  SBERBANK: 'Сбербанк',
  ANY_BANK: 'Любой банк',
} satisfies Record<PayerBankType, string>

export const getPayerBankTypeTitle = (payerBankType: PayerBankType) =>
  payerBankTypeLabels[payerBankType]

export const withdrawalMethodLabels = {
  SBP: 'СБП',
  CARD_NUMBER: 'По номеру карты',
  ACCOUNT_NUMBER: 'По номеру счета',
} satisfies Record<WithdrawalMethod, string>

export const DEFAULT_WITHDRAWAL_METHOD: WithdrawalMethod = 'SBP'

export const getEffectiveWithdrawalMethod = (
  withdrawalMethod: WithdrawalMethod | null | undefined,
): WithdrawalMethod => withdrawalMethod ?? DEFAULT_WITHDRAWAL_METHOD

export const getWithdrawalMethodTitle = (withdrawalMethod: WithdrawalMethod | null | undefined) =>
  withdrawalMethodLabels[getEffectiveWithdrawalMethod(withdrawalMethod)]

export const getEffectiveThirdPartyTransfer = (
  thirdPartyTransfer: boolean | null | undefined,
): boolean => thirdPartyTransfer ?? true

export const getTransferPartyTitle = (thirdPartyTransfer: boolean | null | undefined) =>
  getEffectiveThirdPartyTransfer(thirdPartyTransfer) ? '3 лицо' : '1 лицо'

export type Withdrawal = {
  id: number
  publicId: string
  amountMode: WithdrawalAmountMode
  amountRub: number | null
  amountMinRub: number
  amountMaxRub: number
  recipientPhone: string | null
  recipientBank: RecipientBank | null
  recipientBankTitle: string | null
  recipientName: string | null
  recipientCardNumber: string | null
  recipientAccountNumber: string | null
  recipientCardTbank?: boolean | null
  thirdPartyTransfer?: boolean | null
  payerBankType: PayerBankType
  payerBankTypeTitle: string
  requireSenderFirstParty?: boolean | null
  withdrawalMethod?: WithdrawalMethod | null
  withdrawalMethodTitle?: string | null
  autoReleaseEnabled: boolean
  status: WithdrawalStatus
  statusTitle: string
  attentionRequired: boolean
  completionSeen: boolean
  queueGroupKey: string | null
  queuePosition: number | null
  bybitOrderId: string | null
  bybitOrderAmountRub: number | null
  bybitOrderQuantityUsdt: number | null
  bybitOrderFeeUsdt: number | null
  bybitOrderTotalUsdt: number | null
  createdAt: string
  queuedAt: string | null
  publishedAt: string | null
  orderFoundAt: string | null
  requisitesSentAt: string | null
  paidAt: string | null
  verificationStartedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  lastError: string | null
  lastWarning: string | null
  createdByUsername: string | null
  canCancel: boolean
  canRelease: boolean
}

export type WithdrawalEvent = {
  id: number
  eventType: string
  message: string
  payloadJson: string | null
  actorType: 'SYSTEM' | 'USER'
  actorUsername: string | null
  createdAt: string
}

export type ChatMessageSenderType = 'USER' | 'BOT' | 'COUNTERPARTY' | 'SUPPORT' | 'SYSTEM'
export type AiChatAgentMode = 'ENABLED' | 'DISABLED' | 'DRY_RUN'
export type AiChatAction =
  | 'SEND_MESSAGES'
  | 'SEND_REQUISITES'
  | 'WAIT'
  | 'REQUEST_CANCELLATION'
  | 'HANDOFF'

export type ChatMessageContentType = 'TEXT' | 'IMAGE' | 'PDF' | 'VIDEO' | 'UNKNOWN'

export type ChatMessageContent = {
  type: ChatMessageContentType
  text: string | null
  url: string | null
  fileName: string | null
}

export type ChatMessageRaw = {
  msgType: number | null
  msgCode: number | null
  roleType: string | null
  contentType: string | null
  accountId: string | null
  userId: string | null
  nickName: string | null
}

export type ChatMessageLog = {
  id: string
  bybitOrderId: string
  messageUuid: string | null
  senderType: ChatMessageSenderType
  authorName: string
  content: ChatMessageContent
  raw: ChatMessageRaw
  status: 'PENDING' | 'SENT' | 'FAILED'
  createdAt: string | null
  error: string | null
}

export type EmailReceiptCheck = {
  id: number
  bybitOrderId: string | null
  emailMessageId: string | null
  emailFrom: string | null
  emailSubject: string | null
  emailReceivedAt: string | null
  pdfFilename: string | null
  pdfAvailable: boolean
  parsedStatus: string | null
  parsedAmountRub: number | null
  parsedRecipientPhone: string | null
  parsedRecipientBank: string | null
  parsedRecipientName: string | null
  parsedRecipientCard: string | null
  parsedOperationDate: string | null
  parsedOperationId: string | null
  parsedReceiptNumber: string | null
  verificationStatus: 'FOUND' | 'VERIFIED' | 'FAILED'
  verificationError: string | null
  createdAt: string
}

export type AiChatAgent = {
  exists: boolean
  mode: AiChatAgentMode | null
  modeTitle: string | null
  status: string | null
  statusTitle: string | null
  currentStep: string | null
  currentStepTitle: string | null
  autoReceiptEnabled: boolean
  operatorRequired: boolean
  suggestedMessages: string[]
  suggestedReason: string | null
  suggestedAt: string | null
  lastDecisionSummary: string | null
  lastAction: AiChatAction | null
  conversationSummary: string | null
  summaryUpdatedAt: string | null
  operatorHandoffReason: string | null
}

export type WithdrawalDetails = {
  withdrawal: Withdrawal
  events: WithdrawalEvent[]
  chatMessages: ChatMessageLog[]
  receiptChecks: EmailReceiptCheck[]
  chatAgent: AiChatAgent
}

export type CreateWithdrawalRequest = {
  amountMode: WithdrawalAmountMode
  amountRub: number | null
  amountMinRub: number | null
  amountMaxRub: number | null
  recipientPhone: string
  recipientBank: RecipientBank
  recipientName: string
  recipientCardNumber: string
  recipientAccountNumber: string
  recipientCardTbank: boolean
  thirdPartyTransfer: boolean
  payerBankType: PayerBankType
  requireSenderFirstParty: boolean
  withdrawalMethod: WithdrawalMethod
}

export type WithdrawalAdvertisementPreview = {
  rate: number | null
  minRub: number
  maxRub: number
  amountMinRub: number
  amountMaxRub: number
  quantityUsdt: number | null
  description: string
}

export type SendChatMessageRequest = {
  message: string
}

export type AiChatAgentModeRequest = {
  mode: AiChatAgentMode
}
