import { useMutation, useQueryClient } from '@tanstack/react-query'

import { systemKeys } from '@/entities/system/model/queries'
import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { Withdrawal } from '@/entities/withdrawal/model/types'

export function useReleaseWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => withdrawalApi.release(id),
    onSuccess: (released) => {
      queryClient.setQueryData<Withdrawal[]>(withdrawalKeys.active(), (current = []) =>
        current.filter((item) => item.id !== released.id),
      )
      void queryClient.invalidateQueries({ queryKey: withdrawalKeys.completed() })
      void queryClient.invalidateQueries({ queryKey: withdrawalKeys.details(released.id) })
      void queryClient.invalidateQueries({ queryKey: systemKeys.status() })
    },
  })
}
