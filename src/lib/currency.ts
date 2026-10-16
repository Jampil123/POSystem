const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats a number as Philippine pesos, e.g. 1250 -> "₱1,250.00". */
export function formatCurrency(amount: number): string {
  return pesoFormatter.format(amount)
}

const amountFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats an amount without the peso sign, for receipts: 1250 -> "1,250.00". */
export function formatAmount(amount: number): string {
  return amountFormatter.format(amount)
}
