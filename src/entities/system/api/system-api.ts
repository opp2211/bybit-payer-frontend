import type { SystemStatus } from '@/entities/system/model/types'
import { apiRequest } from '@/shared/api/api-client'

export const systemApi = {
  getStatus: (workspacePublicId: string) =>
    apiRequest<SystemStatus>(`/api/workspaces/${workspacePublicId}/system/status`),
  resync: (workspacePublicId: string) =>
    apiRequest<SystemStatus>(`/api/workspaces/${workspacePublicId}/system/resync`, {
      method: 'POST',
    }),
}
