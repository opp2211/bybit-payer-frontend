import { ExternalLink } from 'lucide-react'

import { compactId } from '@/shared/lib/formatters'

type Props = {
  orderId: string
  compact?: boolean
  prefix?: string
}

export function BybitOrderLink({ orderId, compact = false, prefix = '' }: Props) {
  const label = compact ? compactId(orderId) : orderId
  const href = `https://www.bybit.com/p2p/orderList/${encodeURIComponent(orderId)}`

  return (
    <a
      className="bybit-order-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Открыть ордер на Bybit"
      aria-label={`Открыть ордер ${orderId} на Bybit`}
    >
      <span className="mono">
        {prefix}
        {label}
      </span>
      <ExternalLink size={12} />
    </a>
  )
}
