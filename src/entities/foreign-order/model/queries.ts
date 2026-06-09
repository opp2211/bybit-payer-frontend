import { useQuery } from '@tanstack/react-query'

import { foreignOrderApi } from '@/entities/foreign-order/api/foreign-order-api'

export const foreignOrderKeys = {
  all: ['foreign-orders'] as const,
  active: () => [...foreignOrderKeys.all, 'active'] as const,
}

export function useForeignOrdersQuery() {
  return useQuery({
    queryKey: foreignOrderKeys.active(),
    queryFn: foreignOrderApi.getActive,
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })
}
