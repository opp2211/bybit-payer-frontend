import type {
  CreateWithdrawalRequest,
  SendChatMessageRequest,
  Withdrawal,
  WithdrawalDetails,
} from '@/entities/withdrawal/model/types'
import { apiRequest } from '@/shared/api/api-client'
import { API_BASE_URL } from '@/shared/config/env'

export const withdrawalApi = {
  getActive: () => apiRequest<Withdrawal[]>('/api/withdrawals/active'),
  getCompleted: () => apiRequest<Withdrawal[]>('/api/withdrawals/completed'),
  getDetails: (id: number) => apiRequest<WithdrawalDetails>(`/api/withdrawals/${id}`),
  create: (payload: CreateWithdrawalRequest) =>
    apiRequest<Withdrawal>('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancel: (id: number) =>
    apiRequest<Withdrawal>(`/api/withdrawals/${id}`, {
      method: 'DELETE',
    }),
  markSeen: (id: number) =>
    apiRequest<Withdrawal>(`/api/withdrawals/${id}/mark-seen`, {
      method: 'POST',
    }),
  release: (id: number) =>
    apiRequest<Withdrawal>(`/api/withdrawals/${id}/release`, {
      method: 'POST',
    }),
  sendChatMessage: (id: number, message: string) =>
    apiRequest<void>(`/api/withdrawals/${id}/chat/messages`, {
      method: 'POST',
      body: JSON.stringify({ message } satisfies SendChatMessageRequest),
    }),
  getReceiptPdfUrl: (withdrawalId: number, receiptId: number) =>
    `${API_BASE_URL}/api/withdrawals/${withdrawalId}/receipts/${receiptId}/pdf`,
}
