import {
  CheckCircle2,
  CircleDot,
  Clock3,
  LoaderCircle,
  SearchCheck,
  TriangleAlert,
  XCircle,
} from 'lucide-react'

import type { WithdrawalStatus } from '@/entities/withdrawal/model/types'
import { Badge } from '@/shared/ui/Badge'

const statusConfig: Record<
  WithdrawalStatus,
  { label: string; tone: 'neutral' | 'info' | 'primary' | 'warning' | 'success' | 'danger' }
> = {
  NEW: { label: 'Новая', tone: 'neutral' },
  QUEUED: { label: 'В очереди', tone: 'warning' },
  IN_WORK: { label: 'В работе', tone: 'primary' },
  PAYMENT_IN_PROGRESS: { label: 'Ожидает оплату', tone: 'info' },
  PAYMENT_VERIFICATION: { label: 'Проверка оплаты', tone: 'warning' },
  COMPLETED: { label: 'Завершено', tone: 'success' },
  CANCELLED: { label: 'Отменено', tone: 'neutral' },
  ERROR: { label: 'Ошибка', tone: 'danger' },
}

const statusIcons: Record<WithdrawalStatus, typeof CircleDot> = {
  NEW: CircleDot,
  QUEUED: Clock3,
  IN_WORK: LoaderCircle,
  PAYMENT_IN_PROGRESS: CircleDot,
  PAYMENT_VERIFICATION: SearchCheck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  ERROR: TriangleAlert,
}

type Props = {
  status: WithdrawalStatus
  title?: string
}

export function WithdrawalStatusBadge({ status, title }: Props) {
  const config = statusConfig[status]
  const Icon = statusIcons[status]

  return (
    <Badge tone={config.tone}>
      <Icon size={13} className={status === 'IN_WORK' ? 'spin-slow' : undefined} />
      {title || config.label}
    </Badge>
  )
}
