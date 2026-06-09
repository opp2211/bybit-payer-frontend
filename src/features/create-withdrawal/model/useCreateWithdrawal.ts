import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { CreateWithdrawalRequest, Withdrawal } from '@/entities/withdrawal/model/types'
import { systemKeys } from '@/entities/system/model/queries'

export function useCreateWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateWithdrawalRequest) => withdrawalApi.create(payload),
    onSuccess: (withdrawal) => {
      queryClient.setQueryData<Withdrawal[]>(withdrawalKeys.active(), (current = []) => [
        withdrawal,
        ...current.filter((item) => item.id !== withdrawal.id),
      ])
      void queryClient.invalidateQueries({ queryKey: systemKeys.status() })
    },
  })
}
