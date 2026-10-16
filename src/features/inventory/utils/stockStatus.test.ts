import { getStockStatus, stockStatusLabels } from '@/features/inventory/utils/stockStatus'

describe('getStockStatus', () => {
  it('is Out when there is no stock', () => {
    expect(getStockStatus(0, 5)).toBe('out')
  })

  it('is Low when stock is at the low-stock level', () => {
    expect(getStockStatus(5, 5)).toBe('low')
  })

  it('is Low when stock is below the low-stock level', () => {
    expect(getStockStatus(1, 5)).toBe('low')
  })

  it('is In stock when stock is above the low-stock level', () => {
    expect(getStockStatus(6, 5)).toBe('in')
  })

  it('treats a low-stock level of 0 as "only Out when empty"', () => {
    expect(getStockStatus(1, 0)).toBe('in')
    expect(getStockStatus(0, 0)).toBe('out')
  })

  it('has a word for every status, so it is not shown by color alone', () => {
    expect(stockStatusLabels).toEqual({ in: 'In stock', low: 'Low', out: 'Out' })
  })
})
