import { useQuery } from '@tanstack/react-query'

import { foreignOrderApi } from '@/entities/foreign-order/api/foreign-order-api'

export const foreignOrderKeys = {
  all: ['foreign-orders'] as const,
  active: (workspacePublicId: string) =>
    [...foreignOrderKeys.all, workspacePublicId, 'active'] as const,
}

export function useForeignOrdersQuery(workspacePublicId?: string) {
  return useQuery({
    queryKey: foreignOrderKeys.active(workspacePublicId ?? ''),
    queryFn: () => foreignOrderApi.getActive(workspacePublicId!),
    enabled: Boolean(workspacePublicId),
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })
}
