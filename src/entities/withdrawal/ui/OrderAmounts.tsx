import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { copyToClipboard } from '@/shared/lib/copy-to-clipboard'
import { formatNumber } from '@/shared/lib/formatters'

type Props = {
  withdrawal: Withdrawal
  compact?: boolean
}

export function OrderAmounts({ withdrawal, compact = false }: Props) {
  if (withdrawal.bybitOrderQuantityUsdt == null) return null

  const values = [
    {
      label: 'Сумма',
      value: withdrawal.bybitOrderQuantityUsdt,
    },
    ...(withdrawal.bybitOrderFeeUsdt != null && withdrawal.bybitOrderFeeUsdt > 0
      ? [
          {
            label: 'Комиссия',
            value: withdrawal.bybitOrderFeeUsdt,
          },
        ]
      : []),
    {
      label: 'Total + fees',
      value: withdrawal.bybitOrderTotalUsdt ?? withdrawal.bybitOrderQuantityUsdt,
    },
  ]

  const copy = async (label: string, value: number) => {
    try {
      await copyToClipboard(String(value).replace('.', ','))
      toast.success(`${label} скопирована`)
    } catch {
      toast.error('Не удалось скопировать сумму')
    }
  }

  return (
    <div className={`order-amounts${compact ? ' order-amounts--compact' : ''}`}>
      {values.map((item) => (
        <button
          type="button"
          className="order-amount"
          key={item.label}
          title="Скопировать"
          onClick={() => void copy(item.label, item.value)}
        >
          <span>{item.label}</span>
          <strong>{formatNumber(item.value)} USDT</strong>
          <Copy size={12} />
        </button>
      ))}
    </div>
  )
}
