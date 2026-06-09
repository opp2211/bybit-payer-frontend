import { useQuery } from '@tanstack/react-query'

import { bankApi } from '@/entities/bank/api/bank-api'

export const bankKeys = {
  all: ['banks'] as const,
  active: () => [...bankKeys.all, 'active'] as const,
}

export function useActiveBanksQuery() {
  return useQuery({
    queryKey: bankKeys.active(),
    queryFn: bankApi.getActive,
  })
}
