import { useQuery } from '@tanstack/react-query'

import { adminBankApi } from '@/entities/admin-bank/api/admin-bank-api'

export const adminBankKeys = {
  all: ['admin-banks'] as const,
  list: () => [...adminBankKeys.all, 'list'] as const,
}

export function useAdminBanksQuery(enabled = true) {
  return useQuery({
    queryKey: adminBankKeys.list(),
    queryFn: adminBankApi.list,
    enabled,
  })
}
