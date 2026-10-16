import { roundMoney } from '@/features/pos/utils/computeTotals'

// The expected cash of a shift is worked out by the database (shift_cash_summary),
// because refunds can be paid from a different shift than the sale.
// The app only works out the difference for the live preview while counting.

/** Actual cash counted − expected cash. Negative means the drawer is short. */
export function computeCashDifference(actualCash: number, expectedCash: number): number {
  return roundMoney(actualCash - expectedCash)
}
