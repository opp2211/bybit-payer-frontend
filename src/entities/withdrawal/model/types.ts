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

export type Withdrawal = {
  id: number
  amountRub: number
  recipientPhone: string
  recipientBank: RecipientBank
  recipientBankTitle: string
  recipientName: string
  status: WithdrawalStatus
  statusTitle: string
  attentionRequired: boolean
  completionSeen: boolean
  queueGroupKey: string | null
  queuePosition: number | null
  bybitOrderId: string | null
  bybitOrderAmountRub: number | null
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
  canCancel: boolean
}

export type WithdrawalEvent = {
  id: number
  eventType: string
  message: string
  payloadJson: string | null
  createdAt: string
}

export type ChatMessageLog = {
  id: number
  bybitOrderId: string
  messageIndex: number
  messageText: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  sentAt: string | null
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
  parsedStatus: string | null
  parsedAmountRub: number | null
  parsedRecipientPhone: string | null
  parsedRecipientBank: string | null
  parsedRecipientName: string | null
  parsedOperationDate: string | null
  parsedOperationId: string | null
  parsedReceiptNumber: string | null
  verificationStatus: 'FOUND' | 'VERIFIED' | 'FAILED'
  verificationError: string | null
  createdAt: string
}

export type WithdrawalDetails = {
  withdrawal: Withdrawal
  events: WithdrawalEvent[]
  chatMessages: ChatMessageLog[]
  receiptChecks: EmailReceiptCheck[]
}

export type CreateWithdrawalRequest = {
  amountRub: number
  recipientPhone: string
  recipientBank: RecipientBank
  recipientName: string
}
