import { roundMoney } from '@/features/pos/utils/computeTotals'

export type ChangeResult = {
  /** Cash received − total. 0 when the cash is short or not entered. */
  change: number
  /** True when the cash received covers the total. */
  isEnough: boolean
  /** How much more cash is needed (0 when enough). */
  shortBy: number
}

// Change for a cash payment. Cash received must be at least the total.
export function computeChange(total: number, cashReceived: number | null): ChangeResult {
  if (cashReceived === null) return { change: 0, isEnough: false, shortBy: total }

  const difference = roundMoney(cashReceived - total)
  if (difference < 0) return { change: 0, isEnough: false, shortBy: -difference }
  return { change: difference, isEnough: true, shortBy: 0 }
}
