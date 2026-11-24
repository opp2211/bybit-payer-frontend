import { createContext, useContext } from 'react'

export const WithdrawalUpdatesContext = createContext<string | null>(null)

export function useWithdrawalUpdatesConnected(workspacePublicId?: string) {
  return useContext(WithdrawalUpdatesContext) === workspacePublicId
}
