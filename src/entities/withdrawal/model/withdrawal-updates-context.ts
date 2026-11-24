import { createContext, useContext } from 'react'

export const WithdrawalUpdatesContext = createContext<{
  workspacePublicId: string
  chatPublicId: string | null
  chatSupported: boolean
} | null>(null)

export function useWithdrawalUpdatesConnected(workspacePublicId?: string) {
  const connection = useContext(WithdrawalUpdatesContext)
  return connection !== null && connection.workspacePublicId === workspacePublicId
}

export function useWithdrawalChatUpdatesConnected(
  workspacePublicId?: string,
  withdrawalPublicId?: string,
) {
  const connection = useContext(WithdrawalUpdatesContext)
  return (
    connection !== null &&
    connection.workspacePublicId === workspacePublicId &&
    connection.chatPublicId === withdrawalPublicId &&
    connection.chatSupported
  )
}
