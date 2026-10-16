import { computeCashDifference, computeShiftCash } from '@/features/pos/utils/computeShiftCash'

describe('computeShiftCash', () => {
  it('adds completed sales to the starting cash', () => {
    const cash = computeShiftCash(500, [
      { total: 105, status: 'completed' },
      { total: 65.5, status: 'completed' },
    ])
    expect(cash).toEqual({ startingCash: 500, cashSales: 170.5, refunds: 0, expectedCash: 670.5 })
  })

  it('does not count voided sales', () => {
    const cash = computeShiftCash(500, [
      { total: 105, status: 'completed' },
      { total: 40, status: 'voided' },
    ])
    expect(cash.expectedCash).toBe(605)
  })

  it('counts a refunded sale as a sale and a refund', () => {
    const cash = computeShiftCash(500, [
      { total: 105, status: 'completed' },
      { total: 65, status: 'refunded' },
    ])
    expect(cash).toEqual({ startingCash: 500, cashSales: 170, refunds: 65, expectedCash: 605 })
  })

  it('is the starting cash when there are no sales', () => {
    expect(computeShiftCash(1000, []).expectedCash).toBe(1000)
  })
})

describe('computeCashDifference', () => {
  it('is negative when the drawer is short', () => {
    expect(computeCashDifference(580, 605)).toBe(-25)
  })

  it('is positive when the drawer is over', () => {
    expect(computeCashDifference(605.1, 605)).toBe(0.1)
  })

  it('is 0 when balanced', () => {
    expect(computeCashDifference(605, 605)).toBe(0)
  })
})
