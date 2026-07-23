import type { Withdrawal } from '@/entities/withdrawal/model/types'
import { formatRub } from '@/shared/lib/formatters'

export function getWithdrawalAmountText(withdrawal: Withdrawal): string {
  if (withdrawal.amountMode === 'RANGE') {
    return formatWithdrawalAmountRange(withdrawal.amountMinRub, withdrawal.amountMaxRub)
  }
  return formatRub(withdrawal.amountRub ?? withdrawal.amountMinRub)
}

export function getWithdrawalAmountCopyValue(withdrawal: Withdrawal): string {
  if (withdrawal.amountMode === 'RANGE') {
    return `${withdrawal.amountMinRub}-${withdrawal.amountMaxRub}`
  }
  return String(withdrawal.amountRub ?? withdrawal.amountMinRub)
}

export function getWithdrawalPaidAmountText(withdrawal: Withdrawal): string {
  return formatRub(withdrawal.bybitOrderAmountRub ?? withdrawal.amountRub ?? withdrawal.amountMaxRub)
}

export function formatWithdrawalAmountRange(
  amountMinRub: number | null | undefined,
  amountMaxRub: number | null | undefined,
): string {
  return `${formatRub(amountMinRub)} - ${formatRub(amountMaxRub)}`
}
