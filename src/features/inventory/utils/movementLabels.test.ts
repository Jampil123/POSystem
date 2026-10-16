import { formatQuantityChange, movementTypeLabels } from '@/features/inventory/utils/movementLabels'

describe('formatQuantityChange', () => {
  it('shows a plus sign for stock added', () => {
    expect(formatQuantityChange(24)).toBe('+24')
  })

  it('shows a minus sign for stock removed', () => {
    expect(formatQuantityChange(-3)).toBe('−3')
  })
})

describe('movementTypeLabels', () => {
  it('has a label for every movement type', () => {
    expect(Object.keys(movementTypeLabels).sort()).toEqual(
      ['adjustment', 'refund', 'sale', 'stock_in', 'void'].sort(),
    )
  })
})
