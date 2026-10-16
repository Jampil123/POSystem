import {
  computeLineTotal,
  computeTotals,
  computeVat,
  roundMoney,
  type TotalsInput,
} from '@/features/pos/utils/computeTotals'

// Bread 2 × ₱20.00 + Softdrinks 1 × ₱65.00 = ₱105.00 (UI guide example)
const lines = [
  { unitPrice: 20, quantity: 2 },
  { unitPrice: 65, quantity: 1 },
]

const base: TotalsInput = { lines, discount: null, vatEnabled: false, vatRate: 12 }

describe('roundMoney', () => {
  it('rounds to 2 decimals', () => {
    expect(roundMoney(10.555)).toBe(10.56)
    expect(roundMoney(10.554)).toBe(10.55)
  })

  it('handles floating-point edge cases', () => {
    expect(roundMoney(1.005)).toBe(1.01)
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
  })
})

describe('computeTotals', () => {
  it('adds up the cart with no discount', () => {
    expect(computeTotals(base)).toEqual({
      itemCount: 3,
      subtotal: 105,
      discount: 0,
      total: 105,
      vatAmount: 0,
      discountError: null,
    })
  })

  it('returns zeros for an empty cart', () => {
    expect(computeTotals({ ...base, lines: [] })).toMatchObject({
      itemCount: 0,
      subtotal: 0,
      total: 0,
    })
  })

  it('takes off a peso discount', () => {
    const totals = computeTotals({ ...base, discount: { type: 'amount', value: 5 } })
    expect(totals).toMatchObject({ subtotal: 105, discount: 5, total: 100, discountError: null })
  })

  it('takes off a percent discount', () => {
    const totals = computeTotals({ ...base, discount: { type: 'percent', value: 10 } })
    expect(totals).toMatchObject({ subtotal: 105, discount: 10.5, total: 94.5 })
  })

  it('rounds a percent discount to 2 decimals', () => {
    // 3% of 105.00 = 3.15; 7% of 33.33 = 2.3331 -> 2.33
    const totals = computeTotals({
      ...base,
      lines: [{ unitPrice: 33.33, quantity: 1 }],
      discount: { type: 'percent', value: 7 },
    })
    expect(totals).toMatchObject({ discount: 2.33, total: 31 })
  })

  it('allows a discount equal to the subtotal', () => {
    const totals = computeTotals({ ...base, discount: { type: 'amount', value: 105 } })
    expect(totals).toMatchObject({ total: 0, discountError: null })
  })

  it('rejects a peso discount above the subtotal', () => {
    const totals = computeTotals({ ...base, discount: { type: 'amount', value: 106 } })
    expect(totals).toMatchObject({
      discount: 0,
      total: 105,
      discountError: 'The discount cannot be more than the subtotal.',
    })
  })

  it('rejects a percent discount above 100%', () => {
    const totals = computeTotals({ ...base, discount: { type: 'percent', value: 101 } })
    expect(totals.discountError).toBe('The discount cannot be more than 100%.')
    expect(totals.total).toBe(105)
  })

  it('rejects a negative discount', () => {
    const totals = computeTotals({ ...base, discount: { type: 'amount', value: -5 } })
    expect(totals.discountError).toBe('The discount cannot be negative.')
  })

  it('has no VAT when VAT is off', () => {
    expect(computeTotals({ ...base, vatEnabled: false }).vatAmount).toBe(0)
  })

  it('takes VAT out of the total when VAT is on (prices include VAT)', () => {
    // 105.00 × 12 ÷ 112 = 11.25
    const totals = computeTotals({ ...base, vatEnabled: true })
    expect(totals).toMatchObject({ total: 105, vatAmount: 11.25 })
  })

  it('computes VAT after the discount', () => {
    // (105.00 − 5.00) × 12 ÷ 112 = 10.714... -> 10.71
    const totals = computeTotals({
      ...base,
      vatEnabled: true,
      discount: { type: 'amount', value: 5 },
    })
    expect(totals).toMatchObject({ total: 100, vatAmount: 10.71 })
  })

  it('keeps prices with centavos exact', () => {
    // 3 × 19.99 = 59.97, not 59.970000000000006
    const totals = computeTotals({ ...base, lines: [{ unitPrice: 19.99, quantity: 3 }] })
    expect(totals.subtotal).toBe(59.97)
  })
})

describe('computeLineTotal', () => {
  it('multiplies the price by the quantity', () => {
    expect(computeLineTotal({ unitPrice: 14, quantity: 3 })).toBe(42)
  })
})

describe('computeVat', () => {
  it('is 0 when VAT is off or the rate is 0', () => {
    expect(computeVat(112, false, 12)).toBe(0)
    expect(computeVat(112, true, 0)).toBe(0)
  })

  it('uses total × rate ÷ (100 + rate)', () => {
    expect(computeVat(112, true, 12)).toBe(12)
    expect(computeVat(65, true, 12)).toBe(6.96)
  })
})
