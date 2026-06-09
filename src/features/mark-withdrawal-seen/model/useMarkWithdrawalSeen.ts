import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { Withdrawal } from '@/entities/withdrawal/model/types'

export function useMarkWithdrawalSeen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => withdrawalApi.markSeen(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<Withdrawal[]>(withdrawalKeys.completed(), (current = []) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
    },
  })
}
