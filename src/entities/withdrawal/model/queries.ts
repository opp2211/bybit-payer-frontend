import { useQuery } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'

export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  active: () => [...withdrawalKeys.all, 'active'] as const,
  completed: () => [...withdrawalKeys.all, 'completed'] as const,
  details: (id: number) => [...withdrawalKeys.all, 'details', id] as const,
}

export function useActiveWithdrawalsQuery() {
  return useQuery({
    queryKey: withdrawalKeys.active(),
    queryFn: withdrawalApi.getActive,
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })
}

export function useCompletedWithdrawalsQuery() {
  return useQuery({
    queryKey: withdrawalKeys.completed(),
    queryFn: withdrawalApi.getCompleted,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })
}

export function useWithdrawalDetailsQuery(id: number) {
  return useQuery({
    queryKey: withdrawalKeys.details(id),
    queryFn: () => withdrawalApi.getDetails(id),
    enabled: Number.isInteger(id) && id > 0,
    refetchInterval: 2_000,
  })
}
