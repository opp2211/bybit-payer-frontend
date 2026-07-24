import type { FakeBybitAd, FakeBybitOrder } from '@/entities/p2p-simulator/model/types'
import { apiRequest } from '@/shared/api/api-client'

const BASE_PATH = '/api/local/bybit-simulator'

export const p2pSimulatorApi = {
  getAds: () => apiRequest<FakeBybitAd[]>(`${BASE_PATH}/ads`),
  getActiveOrders: () => apiRequest<FakeBybitOrder[]>(`${BASE_PATH}/orders/active`),
  getOrder: (bybitOrderId: string) =>
    apiRequest<FakeBybitOrder>(`${BASE_PATH}/orders/${bybitOrderId}`),
  createOrder: (bybitAdId: string, amountRub: number) =>
    apiRequest<FakeBybitOrder>(`${BASE_PATH}/ads/${bybitAdId}/orders`, {
      method: 'POST',
      body: JSON.stringify({ amountRub }),
    }),
  sendMessage: (bybitOrderId: string, message: string) =>
    apiRequest<FakeBybitOrder>(`${BASE_PATH}/orders/${bybitOrderId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  markPaid: (bybitOrderId: string) =>
    apiRequest<FakeBybitOrder>(`${BASE_PATH}/orders/${bybitOrderId}/mark-paid`, {
      method: 'POST',
    }),
  cancel: (bybitOrderId: string) =>
    apiRequest<FakeBybitOrder>(`${BASE_PATH}/orders/${bybitOrderId}/cancel`, {
      method: 'POST',
    }),
  reset: () =>
    apiRequest<void>(`${BASE_PATH}/state`, {
      method: 'DELETE',
    }),
}
