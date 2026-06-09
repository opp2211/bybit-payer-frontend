import { useMutation, useQueryClient } from '@tanstack/react-query'

import { foreignOrderApi } from '@/entities/foreign-order/api/foreign-order-api'
import { foreignOrderKeys } from '@/entities/foreign-order/model/queries'

export function useCancelForeignOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => foreignOrderApi.requestCancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foreignOrderKeys.active() })
    },
  })
}
