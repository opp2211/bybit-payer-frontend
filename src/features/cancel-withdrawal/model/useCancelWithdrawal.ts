import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { systemKeys } from '@/entities/system/model/queries'

export type WithdrawalActionVariables = {
  workspacePublicId: string
  withdrawalPublicId: string
}

export function useCancelWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspacePublicId, withdrawalPublicId }: WithdrawalActionVariables) =>
      withdrawalApi.cancel(workspacePublicId, withdrawalPublicId),
    onSuccess: (cancelled, { workspacePublicId, withdrawalPublicId }) => {
      queryClient.setQueryData<Withdrawal[]>(
        withdrawalKeys.active(workspacePublicId),
        (current = []) => current.filter((item) => item.id !== cancelled.id),
      )
      queryClient.setQueryData(
        withdrawalKeys.details(workspacePublicId, withdrawalPublicId),
        (current) =>
          current && typeof current === 'object' ? { ...current, withdrawal: cancelled } : current,
      )
      void queryClient.invalidateQueries({ queryKey: systemKeys.status(workspacePublicId) })
    },
  })
}
