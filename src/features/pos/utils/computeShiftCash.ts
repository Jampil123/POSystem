import { roundMoney } from '@/features/pos/utils/computeTotals'
import type { Enums } from '@/types/database'

export type ShiftSale = {
  total: number
  status: Enums<'sale_status'>
}

export type ShiftCash = {
  startingCash: number
  /** Completed and refunded sales (a refunded sale was paid first). */
  cashSales: number
  /** Cash given back for refunded sales. */
  refunds: number
  /** Starting cash + cash sales − refunds. */
  expectedCash: number
}

// Cash that should be in the drawer, shown before closing a shift.
// Voided sales are not counted. The close_shift database function uses the
// same formula and saves the final numbers.
export function computeShiftCash(startingCash: number, sales: ShiftSale[]): ShiftCash {
  const cashSales = roundMoney(
    sales
      .filter((sale) => sale.status === 'completed' || sale.status === 'refunded')
      .reduce((sum, sale) => sum + sale.total, 0),
  )
  const refunds = roundMoney(
    sales.filter((sale) => sale.status === 'refunded').reduce((sum, sale) => sum + sale.total, 0),
  )
  return {
    startingCash,
    cashSales,
    refunds,
    expectedCash: roundMoney(startingCash + cashSales - refunds),
  }
}

/** Actual cash counted − expected cash. Negative means the drawer is short. */
export function computeCashDifference(actualCash: number, expectedCash: number): number {
  return roundMoney(actualCash - expectedCash)
}
