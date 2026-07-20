import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { CreateWithdrawalRequest, Withdrawal } from '@/entities/withdrawal/model/types'
import { systemKeys } from '@/entities/system/model/queries'

export function useCreateWithdrawal(workspacePublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateWithdrawalRequest) =>
      withdrawalApi.create(workspacePublicId, payload),
    onSuccess: (withdrawal) => {
      queryClient.setQueryData<Withdrawal[]>(
        withdrawalKeys.active(workspacePublicId),
        (current = []) => [withdrawal, ...current.filter((item) => item.id !== withdrawal.id)],
      )
      void queryClient.invalidateQueries({ queryKey: systemKeys.status(workspacePublicId) })
    },
  })
}
