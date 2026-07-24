import { useQuery } from '@tanstack/react-query'

import { p2pSimulatorApi } from '@/entities/p2p-simulator/api/p2p-simulator-api'

export const p2pSimulatorKeys = {
  all: ['p2p-simulator'] as const,
  ads: () => [...p2pSimulatorKeys.all, 'ads'] as const,
  activeOrders: () => [...p2pSimulatorKeys.all, 'orders', 'active'] as const,
  order: (bybitOrderId: string) => [...p2pSimulatorKeys.all, 'orders', bybitOrderId] as const,
}

export function useFakeBybitAdsQuery() {
  return useQuery({
    queryKey: p2pSimulatorKeys.ads(),
    queryFn: p2pSimulatorApi.getAds,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })
}

export function useFakeBybitActiveOrdersQuery() {
  return useQuery({
    queryKey: p2pSimulatorKeys.activeOrders(),
    queryFn: p2pSimulatorApi.getActiveOrders,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })
}

export function useFakeBybitOrderQuery(bybitOrderId?: string | null) {
  return useQuery({
    queryKey: p2pSimulatorKeys.order(bybitOrderId ?? ''),
    queryFn: () => p2pSimulatorApi.getOrder(bybitOrderId!),
    enabled: Boolean(bybitOrderId),
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
  })
}
