export type FakeBybitAd = {
  bybitAdId: string
  workspacePublicId: string | null
  workspaceName: string | null
  published: boolean
  rate: number | null
  minRub: number | null
  maxRub: number | null
  quantityUsdt: number | null
  description: string | null
  activeOrderCount: number
  updatedAt: string | null
}

export type FakeBybitChatMessage = {
  id: string
  message: string
  direction: 'OUTGOING' | 'INCOMING'
  authorName: string
  contentType: string
  createdAt: string | null
}

export type FakeBybitOrder = {
  bybitOrderId: string
  bybitAdId: string
  amountRub: number
  status: string
  statusTitle: string
  quantityUsdt: number
  feeUsdt: number
  createdAt: string
  updatedAt: string
  chatMessages: FakeBybitChatMessage[]
}
