import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { Withdrawal } from '@/entities/withdrawal/model/types'
import type { WithdrawalActionVariables } from '@/features/cancel-withdrawal/model/useCancelWithdrawal'

export function useMarkWithdrawalSeen() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspacePublicId, withdrawalPublicId }: WithdrawalActionVariables) =>
      withdrawalApi.markSeen(workspacePublicId, withdrawalPublicId),
    onSuccess: (updated, { workspacePublicId }) => {
      queryClient.setQueryData<Withdrawal[]>(
        withdrawalKeys.completed(workspacePublicId),
        (current = []) => current.map((item) => (item.id === updated.id ? updated : item)),
      )
    },
  })
}
