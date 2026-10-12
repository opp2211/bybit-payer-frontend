import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { AiChatAgent, WithdrawalDetails } from '@/entities/withdrawal/model/types'

type ChatAgentVariables = {
  workspacePublicId: string
  withdrawalPublicId: string
}

function updateChatAgent(
  current: WithdrawalDetails | undefined,
  chatAgent: AiChatAgent,
): WithdrawalDetails | undefined {
  return current ? { ...current, chatAgent } : current
}

export function useDisableChatAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspacePublicId, withdrawalPublicId }: ChatAgentVariables) =>
      withdrawalApi.disableChatAgent(workspacePublicId, withdrawalPublicId),
    onSuccess: (chatAgent, { workspacePublicId, withdrawalPublicId }) => {
      queryClient.setQueryData<WithdrawalDetails>(
        withdrawalKeys.details(workspacePublicId, withdrawalPublicId),
        (current) => updateChatAgent(current, chatAgent),
      )
      void queryClient.invalidateQueries({
        queryKey: withdrawalKeys.details(workspacePublicId, withdrawalPublicId),
      })
    },
  })
}
