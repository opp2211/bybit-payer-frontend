import type { ForeignBybitOrder } from '@/entities/foreign-order/model/types'
import { apiRequest } from '@/shared/api/api-client'

export const foreignOrderApi = {
  getActive: (workspacePublicId: string) =>
    apiRequest<ForeignBybitOrder[]>(`/api/workspaces/${workspacePublicId}/foreign-orders/active`),
  getDetails: (workspacePublicId: string, id: number) =>
    apiRequest<ForeignBybitOrder>(`/api/workspaces/${workspacePublicId}/foreign-orders/${id}`),
}
