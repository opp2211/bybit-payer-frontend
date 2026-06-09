import { useMutation, useQueryClient } from '@tanstack/react-query'

import { systemApi } from '@/entities/system/api/system-api'
import { systemKeys } from '@/entities/system/model/queries'
import { withdrawalKeys } from '@/entities/withdrawal/model/queries'

export function useResyncSystem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: systemApi.resync,
    onSuccess: (status) => {
      queryClient.setQueryData(systemKeys.status(), status)
      void queryClient.invalidateQueries({ queryKey: withdrawalKeys.active() })
    },
  })
}
