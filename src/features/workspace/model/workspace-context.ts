import { createContext } from 'react'

import type { Workspace } from '@/entities/workspace/model/types'

export type WorkspaceContextValue = {
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  selectedWorkspaceId: string | null
  loading: boolean
  error: unknown
  selectWorkspace: (publicId: string) => void
  refetchWorkspaces: () => Promise<unknown>
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
