import { computeChange } from '@/features/pos/utils/computeChange'
import { parseAmount } from '@/features/pos/utils/parseAmount'

describe('computeChange', () => {
  it('gives no change for the exact amount', () => {
    expect(computeChange(105, 105)).toEqual({ change: 0, isEnough: true, shortBy: 0 })
  })

  it('gives change for an overpayment', () => {
    expect(computeChange(105, 200)).toEqual({ change: 95, isEnough: true, shortBy: 0 })
  })

  it('marks short cash as not enough', () => {
    expect(computeChange(105, 100)).toEqual({ change: 0, isEnough: false, shortBy: 5 })
  })

  it('is not enough when no cash is entered', () => {
    expect(computeChange(105, null)).toEqual({ change: 0, isEnough: false, shortBy: 105 })
  })

  it('rounds the change to 2 decimals', () => {
    // 100.00 − 94.45 = 5.549999... in floating point
    expect(computeChange(94.45, 100).change).toBe(5.55)
    expect(computeChange(0.3, 0.5).change).toBe(0.2)
  })

  it('rounds the short amount to 2 decimals', () => {
    expect(computeChange(10.1, 10).shortBy).toBe(0.1)
  })
})

describe('parseAmount', () => {
  it('reads whole and decimal amounts', () => {
    expect(parseAmount('200')).toBe(200)
    expect(parseAmount(' 105.50 ')).toBe(105.5)
  })

  it.each(['', 'abc', '-5', '10.555', '1,000'])('rejects "%s"', (text) => {
    expect(parseAmount(text)).toBeNull()
  })
})
