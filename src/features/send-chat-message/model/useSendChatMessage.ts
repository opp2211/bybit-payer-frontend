import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'

export function useSendChatMessage(withdrawalId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: string) => withdrawalApi.sendChatMessage(withdrawalId, message),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: withdrawalKeys.details(withdrawalId) })
    },
  })
}
