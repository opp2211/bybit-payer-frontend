import { useQuery } from '@tanstack/react-query'

import { systemApi } from '@/entities/system/api/system-api'

export const systemKeys = {
  all: ['system'] as const,
  status: () => [...systemKeys.all, 'status'] as const,
}

export function useSystemStatusQuery() {
  return useQuery({
    queryKey: systemKeys.status(),
    queryFn: systemApi.getStatus,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  })
}
