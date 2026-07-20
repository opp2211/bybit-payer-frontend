import { useQuery } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'

export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  workspace: (workspacePublicId: string) => [...withdrawalKeys.all, workspacePublicId] as const,
  active: (workspacePublicId: string) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'active'] as const,
  completed: (workspacePublicId: string) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'completed'] as const,
  details: (workspacePublicId: string, withdrawalPublicId: string) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'details', withdrawalPublicId] as const,
}

export function useActiveWithdrawalsQuery(workspacePublicId?: string) {
  return useQuery({
    queryKey: withdrawalKeys.active(workspacePublicId ?? ''),
    queryFn: () => withdrawalApi.getActive(workspacePublicId!),
    enabled: Boolean(workspacePublicId),
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
  })
}

export function useCompletedWithdrawalsQuery(workspacePublicId?: string) {
  return useQuery({
    queryKey: withdrawalKeys.completed(workspacePublicId ?? ''),
    queryFn: () => withdrawalApi.getCompleted(workspacePublicId!),
    enabled: Boolean(workspacePublicId),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })
}

export function useWithdrawalDetailsQuery(workspacePublicId?: string, withdrawalPublicId?: string) {
  return useQuery({
    queryKey: withdrawalKeys.details(workspacePublicId ?? '', withdrawalPublicId ?? ''),
    queryFn: () => withdrawalApi.getDetails(workspacePublicId!, withdrawalPublicId!),
    enabled: Boolean(workspacePublicId && withdrawalPublicId),
    refetchInterval: 2_000,
  })
}
