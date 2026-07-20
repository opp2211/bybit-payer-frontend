import type { AdminBank, AdminBankPayload } from '@/entities/admin-bank/model/types'
import { apiRequest } from '@/shared/api/api-client'

export const adminBankApi = {
  list: () => apiRequest<AdminBank[]>('/api/admin/banks'),
  create: (payload: AdminBankPayload) =>
    apiRequest<AdminBank>('/api/admin/banks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: AdminBankPayload) =>
    apiRequest<AdminBank>(`/api/admin/banks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/admin/banks/${id}`, {
      method: 'DELETE',
    }),
}
