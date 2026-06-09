import type {
  CreateWithdrawalRequest,
  Withdrawal,
  WithdrawalDetails,
} from '@/entities/withdrawal/model/types'
import { apiRequest } from '@/shared/api/api-client'

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
}
