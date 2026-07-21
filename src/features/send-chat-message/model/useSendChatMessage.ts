import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'

export function useSendChatMessage(workspacePublicId: string, withdrawalPublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) =>
      withdrawalApi.sendChatMessage(workspacePublicId, withdrawalPublicId, message),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: withdrawalKeys.details(workspacePublicId, withdrawalPublicId),
      })
    },
  })
}
