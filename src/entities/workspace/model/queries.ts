import { useQuery } from '@tanstack/react-query'

import { workspaceApi } from '@/entities/workspace/api/workspace-api'

export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceKeys.all, 'list'] as const,
  members: (workspacePublicId: string) =>
    [...workspaceKeys.all, workspacePublicId, 'members'] as const,
}

export function useWorkspacesQuery() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: workspaceApi.list,
  })
}

export function useWorkspaceMembersQuery(workspacePublicId?: string) {
  return useQuery({
    queryKey: workspaceKeys.members(workspacePublicId ?? ''),
    queryFn: () => workspaceApi.listMembers(workspacePublicId!),
    enabled: Boolean(workspacePublicId),
  })
}
