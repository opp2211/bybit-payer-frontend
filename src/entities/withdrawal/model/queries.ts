import { useQuery } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import type { CreateWithdrawalRequest } from '@/entities/withdrawal/model/types'
import {
  useWithdrawalChatUpdatesConnected,
  useWithdrawalUpdatesConnected,
} from '@/entities/withdrawal/model/withdrawal-updates-context'

const FALLBACK_INTERVAL = 10_000
const RECONCILIATION_INTERVAL = 60_000

export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  workspace: (workspacePublicId: string) => [...withdrawalKeys.all, workspacePublicId] as const,
  active: (workspacePublicId: string) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'active'] as const,
  completed: (workspacePublicId: string) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'completed'] as const,
  soundEvents: (workspacePublicId: string) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'sound-events'] as const,
  detailPages: (workspacePublicId: string) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'details'] as const,
  details: (workspacePublicId: string, withdrawalPublicId: string) =>
    [...withdrawalKeys.detailPages(workspacePublicId), withdrawalPublicId] as const,
  preview: (workspacePublicId: string, payload: CreateWithdrawalRequest | null) =>
    [...withdrawalKeys.workspace(workspacePublicId), 'preview', payload] as const,
}

export function useActiveWithdrawalsQuery(workspacePublicId?: string) {
  const connected = useWithdrawalUpdatesConnected(workspacePublicId)
  return useQuery({
    queryKey: withdrawalKeys.active(workspacePublicId ?? ''),
    queryFn: () => withdrawalApi.getActive(workspacePublicId!),
    enabled: Boolean(workspacePublicId),
    refetchInterval: connected ? RECONCILIATION_INTERVAL : FALLBACK_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function useCompletedWithdrawalsQuery(workspacePublicId?: string) {
  const connected = useWithdrawalUpdatesConnected(workspacePublicId)
  return useQuery({
    queryKey: withdrawalKeys.completed(workspacePublicId ?? ''),
    queryFn: () => withdrawalApi.getCompleted(workspacePublicId!),
    enabled: Boolean(workspacePublicId),
    refetchInterval: connected ? RECONCILIATION_INTERVAL : FALLBACK_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function useWithdrawalDetailsQuery(workspacePublicId?: string, withdrawalPublicId?: string) {
  const connected = useWithdrawalChatUpdatesConnected(workspacePublicId, withdrawalPublicId)
  return useQuery({
    queryKey: withdrawalKeys.details(workspacePublicId ?? '', withdrawalPublicId ?? ''),
    queryFn: ({ signal }) =>
      withdrawalApi.getDetails(workspacePublicId!, withdrawalPublicId!, signal),
    enabled: Boolean(workspacePublicId && withdrawalPublicId),
    refetchInterval: connected ? false : FALLBACK_INTERVAL,
    refetchIntervalInBackground: true,
  })
}

export function useWithdrawalSoundEventsQuery(workspacePublicId: string) {
  const connected = useWithdrawalUpdatesConnected(workspacePublicId)
  return useQuery({
    queryKey: withdrawalKeys.soundEvents(workspacePublicId),
    queryFn: ({ signal }) => withdrawalApi.getSoundEvents(workspacePublicId, signal),
    refetchInterval: connected ? false : FALLBACK_INTERVAL,
    refetchIntervalInBackground: true,
    retry: false,
  })
}

export function useWithdrawalAdvertisementPreviewQuery(
  workspacePublicId: string,
  payload: CreateWithdrawalRequest | null,
  rateKey: number | null | undefined,
) {
  return useQuery({
    queryKey: [...withdrawalKeys.preview(workspacePublicId, payload), rateKey] as const,
    queryFn: () => withdrawalApi.previewAdvertisement(workspacePublicId, payload!),
    enabled: Boolean(workspacePublicId && payload),
  })
}
