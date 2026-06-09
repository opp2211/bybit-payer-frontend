import type { ForeignBybitOrder } from '@/entities/foreign-order/model/types'
import { apiRequest } from '@/shared/api/api-client'

export const foreignOrderApi = {
  getActive: () => apiRequest<ForeignBybitOrder[]>('/api/foreign-orders/active'),
  getDetails: (id: number) => apiRequest<ForeignBybitOrder>(`/api/foreign-orders/${id}`),
}
