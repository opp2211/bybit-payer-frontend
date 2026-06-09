import type { Bank } from '@/entities/bank/model/types'
import { apiRequest } from '@/shared/api/api-client'

export const bankApi = {
  getActive: () => apiRequest<Bank[]>('/api/banks'),
}
