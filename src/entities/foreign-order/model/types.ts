export type ForeignBybitOrder = {
  id: number
  bybitOrderId: string
  amountRub: number
  bybitStatus: string | null
  reason: string
  cancelRequested: boolean
  cancelRequestAttempts: number
  cancelRequestedAt: string | null
  attentionRequired: boolean
  createdAt: string
  updatedAt: string
  lastError: string | null
}
