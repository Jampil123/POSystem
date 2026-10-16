import { formatCurrency } from '@/lib/currency'

describe('formatCurrency', () => {
  it('adds the peso sign, comma separators, and two decimals', () => {
    expect(formatCurrency(1250)).toBe('₱1,250.00')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₱0.00')
  })

  it('keeps cents', () => {
    expect(formatCurrency(105.5)).toBe('₱105.50')
    expect(formatCurrency(0.05)).toBe('₱0.05')
  })

  it('formats large amounts', () => {
    expect(formatCurrency(1234567.89)).toBe('₱1,234,567.89')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-95)).toBe('-₱95.00')
  })
})
