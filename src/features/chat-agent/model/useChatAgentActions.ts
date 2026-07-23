import { useMutation, useQueryClient } from '@tanstack/react-query'

import { withdrawalApi } from '@/entities/withdrawal/api/withdrawal-api'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'
import type { AiChatAgent, WithdrawalDetails } from '@/entities/withdrawal/model/types'

type ChatAgentVariables = {
  workspacePublicId: string
  withdrawalPublicId: string
}

type ChatAgentModeVariables = ChatAgentVariables & {
  enabled: boolean
}

function updateChatAgent(
  current: WithdrawalDetails | undefined,
  chatAgent: AiChatAgent,
): WithdrawalDetails | undefined {
  return current ? { ...current, chatAgent } : current
}

export function useSetChatAgentMode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspacePublicId, withdrawalPublicId, enabled }: ChatAgentModeVariables) =>
      withdrawalApi.setChatAgentMode(workspacePublicId, withdrawalPublicId, enabled),
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

export function useSendChatAgentSuggestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workspacePublicId, withdrawalPublicId }: ChatAgentVariables) =>
      withdrawalApi.sendChatAgentSuggestion(workspacePublicId, withdrawalPublicId),
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
