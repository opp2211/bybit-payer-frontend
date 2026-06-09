import { AlertTriangle, ArrowUpRight, Banknote, CircleDotDashed, Wallet } from 'lucide-react'

import type { ForeignBybitOrder } from '@/entities/foreign-order/model/types'
import type { SystemStatus } from '@/entities/system/model/types'
import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { formatNumber, formatRub } from '@/shared/lib/formatters'

type Props = {
  active: Withdrawal[]
  foreignOrders: ForeignBybitOrder[]
  system?: SystemStatus
}

export function OverviewCards({ active, foreignOrders, system }: Props) {
  const inWork = active.filter((item) => item.status === 'IN_WORK').length
  const attention =
    active.filter((item) => item.attentionRequired).length +
    foreignOrders.filter((item) => item.attentionRequired).length
  const activeVolume = active.reduce((total, item) => total + item.amountRub, 0)

  const cards = [
    {
      label: 'Активные заявки',
      value: String(active.length),
      meta: `${formatRub(activeVolume)} в обработке`,
      icon: CircleDotDashed,
      tone: 'primary',
    },
    {
      label: 'Опубликовано',
      value: String(inWork),
      meta: system?.adPublished ? 'Объявление активно' : 'Объявление не активно',
      icon: ArrowUpRight,
      tone: 'info',
    },
    {
      label: 'Требует внимания',
      value: String(attention),
      meta: attention ? 'Нужна проверка оператора' : 'Критичных событий нет',
      icon: AlertTriangle,
      tone: attention ? 'warning' : 'success',
    },
    {
      label: 'Доступный баланс',
      value:
        system?.availableUsdtBalance == null
          ? '—'
          : `${formatNumber(system.availableUsdtBalance)} USDT`,
      meta:
        system?.currentRate == null
          ? 'Курс пока не получен'
          : `Курс ${formatNumber(system.currentRate)} ₽`,
      icon: Wallet,
      tone: 'dark',
    },
  ]

  return (
    <div className="overview-grid">
      {cards.map(({ label, value, meta, icon: Icon, tone }) => (
        <article className={`metric-card metric-card--${tone}`} key={label}>
          <div className="metric-card__top">
            <span>{label}</span>
            <span className="metric-card__icon">
              <Icon size={18} />
            </span>
          </div>
          <strong>{value}</strong>
          <small>
            {label === 'Активные заявки' && <Banknote size={12} />}
            {meta}
          </small>
        </article>
      ))}
    </div>
  )
}
