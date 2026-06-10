import { CircleDollarSign, Megaphone, Wallet } from 'lucide-react'

import type { SystemStatus } from '@/entities/system/model/types'
import { compactId, formatNumber, formatRub } from '@/shared/lib/formatters'
import { Badge } from '@/shared/ui/Badge'

type Props = {
  system?: SystemStatus
}

export function OverviewCards({ system }: Props) {
  return (
    <section className="market-overview" aria-label="Баланс и объявление Bybit">
      <article className="balance-overview">
        <div className="market-overview__heading">
          <span className="market-overview__icon">
            <Wallet size={19} />
          </span>
          <span>Доступный баланс</span>
        </div>
        <strong className="balance-overview__usdt">
          {system?.availableUsdtBalance == null
            ? '—'
            : `${formatNumber(system.availableUsdtBalance)} USDT`}
        </strong>
        <div className="balance-overview__stats">
          <div>
            <span>В рублях</span>
            <strong>{formatRub(system?.availableRubBalance)}</strong>
          </div>
          <div>
            <span>Курс 7-й позиции</span>
            <strong>
              {system?.referenceRate7 == null ? '—' : `${formatNumber(system.referenceRate7)} ₽`}
            </strong>
          </div>
          <div>
            <span>Курс 15-й позиции</span>
            <strong>
              {system?.referenceRate15 == null ? '—' : `${formatNumber(system.referenceRate15)} ₽`}
            </strong>
          </div>
        </div>
      </article>

      <article className="ad-overview">
        <div className="ad-overview__top">
          <div className="market-overview__heading">
            <span className="market-overview__icon">
              <Megaphone size={19} />
            </span>
            <div>
              <span>Объявление Bybit</span>
              <small className="mono">{compactId(system?.bybitAdId)}</small>
            </div>
          </div>
          <Badge tone={system?.adPublished ? 'success' : 'neutral'}>
            {system?.adPublished ? 'Опубликовано' : 'Не опубликовано'}
          </Badge>
        </div>
        <div className="ad-overview__stats">
          <div>
            <span>Текущий курс</span>
            <strong>
              {system?.currentRate == null ? '—' : `${formatNumber(system.currentRate)} ₽`}
            </strong>
            <small>позиция {system?.currentRateSourcePosition ?? '—'}</small>
          </div>
          <div>
            <span>Диапазон</span>
            <strong>
              {formatRub(system?.currentMinRub)} — {formatRub(system?.currentMaxRub)}
            </strong>
          </div>
          <div>
            <span>Объём</span>
            <strong>
              {system?.currentQuantityUsdt == null
                ? '—'
                : `${formatNumber(system.currentQuantityUsdt)} USDT`}
            </strong>
          </div>
        </div>
        <p>
          <CircleDollarSign size={14} />
          {system?.currentDescription || 'Описание объявления пока не сформировано'}
        </p>
      </article>
    </section>
  )
}
