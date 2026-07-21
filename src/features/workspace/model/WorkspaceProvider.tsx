import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { useWorkspacesQuery } from '@/entities/workspace/model/queries'
import { WorkspaceContext } from '@/features/workspace/model/workspace-context'

const STORAGE_KEY = 'flowpay:selected-workspace'

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const workspacesQuery = useWorkspacesQuery()
  const { data, error, isLoading, isSuccess, refetch } = workspacesQuery
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  const workspaces = useMemo(() => data ?? [], [data])
  const selectedWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.publicId === selectedWorkspaceId) ??
      workspaces[0] ??
      null,
    [selectedWorkspaceId, workspaces],
  )

  useEffect(() => {
    if (!isSuccess) return

    if (!selectedWorkspace) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    localStorage.setItem(STORAGE_KEY, selectedWorkspace.publicId)
  }, [selectedWorkspace, isSuccess])

  const selectWorkspace = useCallback((publicId: string) => {
    setSelectedWorkspaceId(publicId)
    localStorage.setItem(STORAGE_KEY, publicId)
  }, [])

  const refetchWorkspaces = useCallback(() => refetch(), [refetch])

  const value = useMemo(
    () => ({
      workspaces,
      selectedWorkspace,
      selectedWorkspaceId: selectedWorkspace?.publicId ?? null,
      loading: isLoading,
      error,
      selectWorkspace,
      refetchWorkspaces,
    }),
    [error, isLoading, refetchWorkspaces, selectedWorkspace, selectWorkspace, workspaces],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
