import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { systemKeys } from '@/entities/system/model/queries'

export function useCancelWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => withdrawalApi.cancel(id),
    onSuccess: (cancelled) => {
      queryClient.setQueryData<Withdrawal[]>(withdrawalKeys.active(), (current = []) =>
        current.filter((item) => item.id !== cancelled.id),
      )
      queryClient.setQueryData(withdrawalKeys.details(cancelled.id), (current) =>
        current && typeof current === 'object' ? { ...current, withdrawal: cancelled } : current,
      )
      void queryClient.invalidateQueries({ queryKey: systemKeys.status() })
    },
  })
}
