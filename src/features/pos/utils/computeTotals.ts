// Shared money helpers for the POS. All totals, discount, and VAT math goes
// through here, and money is rounded to 2 decimals in one place: roundMoney.
//
// Prices already include VAT, so VAT never changes what the customer pays;
// it is only the part of the total that is tax. The database function
// complete_sale uses the same formulas.

/** Rounds to 2 decimals (centavos), half up. The only place money is rounded. */
export function roundMoney(amount: number): number {
  // Working in centavos avoids floating-point surprises such as 1.005 -> 1.00.
  return Math.round(Number((amount * 100).toFixed(6))) / 100
}

export type DiscountType = 'amount' | 'percent'

export type Discount = {
  type: DiscountType
  /** Pesos when type is 'amount', percent (0–100) when type is 'percent'. */
  value: number
}

export type TotalsLine = {
  unitPrice: number
  quantity: number
}

export type TotalsInput = {
  lines: TotalsLine[]
  discount: Discount | null
  vatEnabled: boolean
  /** Percent, e.g. 12 */
  vatRate: number
}

export type Totals = {
  /** Number of pieces in the cart. */
  itemCount: number
  subtotal: number
  /** Discount in pesos. 0 when there is no discount or it is not valid. */
  discount: number
  /** Subtotal less the discount. This is what the customer pays. */
  total: number
  /** VAT included in the total (0 when VAT is off). */
  vatAmount: number
  /** Set when the discount cannot be used. */
  discountError: string | null
}

export function computeLineTotal(line: TotalsLine): number {
  return roundMoney(line.unitPrice * line.quantity)
}

/** VAT portion of a VAT-inclusive amount: amount × rate ÷ (100 + rate). */
export function computeVat(total: number, vatEnabled: boolean, vatRate: number): number {
  if (!vatEnabled || vatRate <= 0) return 0
  return roundMoney((total * vatRate) / (100 + vatRate))
}

function discountInPesos(
  discount: Discount | null,
  subtotal: number,
): { amount: number; error: string | null } {
  if (!discount || discount.value === 0) return { amount: 0, error: null }
  if (discount.value < 0) return { amount: 0, error: 'The discount cannot be negative.' }

  if (discount.type === 'percent') {
    if (discount.value > 100) return { amount: 0, error: 'The discount cannot be more than 100%.' }
    return { amount: roundMoney((subtotal * discount.value) / 100), error: null }
  }

  if (discount.value > subtotal) {
    return { amount: 0, error: 'The discount cannot be more than the subtotal.' }
  }
  return { amount: roundMoney(discount.value), error: null }
}

export function computeTotals({ lines, discount, vatEnabled, vatRate }: TotalsInput): Totals {
  const itemCount = lines.reduce((count, line) => count + line.quantity, 0)
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + computeLineTotal(line), 0))
  const { amount: discountAmount, error: discountError } = discountInPesos(discount, subtotal)
  const total = roundMoney(subtotal - discountAmount)

  return {
    itemCount,
    subtotal,
    discount: discountAmount,
    total,
    vatAmount: computeVat(total, vatEnabled, vatRate),
    discountError,
  }
}
