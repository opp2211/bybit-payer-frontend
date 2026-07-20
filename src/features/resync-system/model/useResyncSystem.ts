import { useMutation, useQueryClient } from '@tanstack/react-query'

import { systemApi } from '@/entities/system/api/system-api'
import { systemKeys } from '@/entities/system/model/queries'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'

export function useResyncSystem(workspacePublicId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => systemApi.resync(workspacePublicId),
    onSuccess: (status) => {
      queryClient.setQueryData(systemKeys.status(workspacePublicId), status)
      void queryClient.invalidateQueries({ queryKey: withdrawalKeys.active(workspacePublicId) })
    },
  })
}
