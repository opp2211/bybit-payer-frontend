import { useQuery } from '@tanstack/react-query'

import { systemApi } from '@/entities/system/api/system-api'

export const systemKeys = {
  all: ['system'] as const,
  status: (workspacePublicId: string) => [...systemKeys.all, workspacePublicId, 'status'] as const,
}

export function useSystemStatusQuery(workspacePublicId?: string) {
  return useQuery({
    queryKey: systemKeys.status(workspacePublicId ?? ''),
    queryFn: () => systemApi.getStatus(workspacePublicId!),
    enabled: Boolean(workspacePublicId),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })
}
