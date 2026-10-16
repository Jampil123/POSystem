import { computeCashDifference } from '@/features/pos/utils/computeShiftCash'

// The expected cash itself is computed in the database and tested in supabase/tests.

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
