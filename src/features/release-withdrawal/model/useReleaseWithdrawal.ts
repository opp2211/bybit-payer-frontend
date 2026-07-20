import { useMutation, useQueryClient } from '@tanstack/react-query'

import { systemKeys } from '@/entities/system/model/queries'
import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { Withdrawal } from '@/entities/withdrawal/model/types'
import type { WithdrawalActionVariables } from '@/features/cancel-withdrawal/model/useCancelWithdrawal'

export function useReleaseWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspacePublicId, withdrawalPublicId }: WithdrawalActionVariables) =>
      withdrawalApi.release(workspacePublicId, withdrawalPublicId),
    onSuccess: (released, { workspacePublicId, withdrawalPublicId }) => {
      queryClient.setQueryData<Withdrawal[]>(
        withdrawalKeys.active(workspacePublicId),
        (current = []) => current.filter((item) => item.id !== released.id),
      )
      void queryClient.invalidateQueries({ queryKey: withdrawalKeys.completed(workspacePublicId) })
      void queryClient.invalidateQueries({
        queryKey: withdrawalKeys.details(workspacePublicId, withdrawalPublicId),
      })
      void queryClient.invalidateQueries({ queryKey: systemKeys.status(workspacePublicId) })
    },
  })
}
