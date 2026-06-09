import type { SystemStatus } from '@/entities/system/model/types'
import { apiRequest } from '@/shared/api/api-client'

export const systemApi = {
  getStatus: () => apiRequest<SystemStatus>('/api/system/status'),
  resync: () =>
    apiRequest<SystemStatus>('/api/system/resync', {
      method: 'POST',
    }),
}
