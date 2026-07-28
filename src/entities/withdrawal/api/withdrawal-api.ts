import type {
  AiChatAgent,
  CreateWithdrawalRequest,
  SendChatMessageRequest,
  Withdrawal,
  WithdrawalAdvertisementPreview,
  WithdrawalDetails,
} from '@/entities/withdrawal/model/types'
import { apiRequest } from '@/shared/api/api-client'
import { API_BASE_URL } from '@/shared/config/env'

export const withdrawalApi = {
  getActive: (workspacePublicId: string) =>
    apiRequest<Withdrawal[]>(`/api/workspaces/${workspacePublicId}/withdrawals/active`),
  getCompleted: (workspacePublicId: string) =>
    apiRequest<Withdrawal[]>(`/api/workspaces/${workspacePublicId}/withdrawals/completed`),
  getDetails: (workspacePublicId: string, withdrawalPublicId: string) =>
    apiRequest<WithdrawalDetails>(
      `/api/workspaces/${workspacePublicId}/withdrawals/${withdrawalPublicId}`,
    ),
  create: (workspacePublicId: string, payload: CreateWithdrawalRequest) =>
    apiRequest<Withdrawal>(`/api/workspaces/${workspacePublicId}/withdrawals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  previewAdvertisement: (workspacePublicId: string, payload: CreateWithdrawalRequest) =>
    apiRequest<WithdrawalAdvertisementPreview>(
      `/api/workspaces/${workspacePublicId}/withdrawals/preview`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
  cancel: (workspacePublicId: string, withdrawalPublicId: string) =>
    apiRequest<Withdrawal>(
      `/api/workspaces/${workspacePublicId}/withdrawals/${withdrawalPublicId}`,
      {
        method: 'DELETE',
      },
    ),
  markSeen: (workspacePublicId: string, withdrawalPublicId: string) =>
    apiRequest<Withdrawal>(
      `/api/workspaces/${workspacePublicId}/withdrawals/${withdrawalPublicId}/mark-seen`,
      {
        method: 'POST',
      },
    ),
  release: (workspacePublicId: string, withdrawalPublicId: string) =>
    apiRequest<Withdrawal>(
      `/api/workspaces/${workspacePublicId}/withdrawals/${withdrawalPublicId}/release`,
      {
        method: 'POST',
      },
    ),
  sendChatMessage: (workspacePublicId: string, withdrawalPublicId: string, message: string) =>
    apiRequest<void>(
      `/api/workspaces/${workspacePublicId}/withdrawals/${withdrawalPublicId}/chat/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message } satisfies SendChatMessageRequest),
      },
    ),
  disableChatAgent: (workspacePublicId: string, withdrawalPublicId: string) =>
    apiRequest<AiChatAgent>(
      `/api/workspaces/${workspacePublicId}/withdrawals/${withdrawalPublicId}/chat-agent/disable`,
      {
        method: 'POST',
      },
    ),
  getReceiptPdfUrl: (workspacePublicId: string, withdrawalPublicId: string, receiptId: number) =>
    `${API_BASE_URL}/api/workspaces/${workspacePublicId}/withdrawals/${withdrawalPublicId}/receipts/${receiptId}/pdf`,
}
