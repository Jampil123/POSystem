import {
  adjustmentQuantityChange,
  adjustmentReasonText,
  adjustmentSchema,
  stockInSchema,
  todayDateString,
  type AdjustmentFormInput,
  type StockInFormInput,
} from '@/features/inventory/schema'

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? [])
}

describe('stockInSchema', () => {
  const validInput: StockInFormInput = {
    supplier_name: ' Supplier A ',
    received_date: '2026-01-15',
    items: [{ product_id: 1, product_name: 'Rice 1kg', quantity: '10', unit_cost: '48.50' }],
  }

  it('turns valid text into numbers', () => {
    expect(stockInSchema.parse(validInput)).toEqual({
      supplier_name: 'Supplier A',
      received_date: '2026-01-15',
      items: [{ product_id: 1, product_name: 'Rice 1kg', quantity: 10, unit_cost: 48.5 }],
    })
  })

  it('allows an empty supplier name', () => {
    expect(stockInSchema.safeParse({ ...validInput, supplier_name: '' }).success).toBe(true)
  })

  it('needs at least one item', () => {
    expect(messages(stockInSchema.safeParse({ ...validInput, items: [] }))).toContain(
      'Add at least one item.',
    )
  })

  it.each(['0', '-2', '1.5', ''])('rejects the quantity "%s"', (quantity) => {
    const item = { ...validInput.items[0], quantity }
    expect(stockInSchema.safeParse({ ...validInput, items: [item] }).success).toBe(false)
  })

  it('rejects a negative unit cost', () => {
    const item = { ...validInput.items[0], unit_cost: '-1' }
    expect(stockInSchema.safeParse({ ...validInput, items: [item] }).success).toBe(false)
  })

  it('rejects a date in the future', () => {
    const tomorrow = todayDateString(new Date(Date.now() + 24 * 60 * 60 * 1000))
    expect(messages(stockInSchema.safeParse({ ...validInput, received_date: tomorrow }))).toContain(
      'The date cannot be in the future.',
    )
  })

  it('accepts today', () => {
    expect(
      stockInSchema.safeParse({ ...validInput, received_date: todayDateString() }).success,
    ).toBe(true)
  })
})

describe('adjustmentSchema', () => {
  const validInput: AdjustmentFormInput = {
    product_id: 4,
    current_stock: 10,
    direction: 'remove',
    quantity: '3',
    reason: 'Damaged',
    notes: '',
  }

  it('accepts a valid removal', () => {
    expect(adjustmentSchema.parse(validInput)).toMatchObject({ quantity: 3, reason: 'Damaged' })
  })

  it('blocks removing more than the current stock', () => {
    expect(messages(adjustmentSchema.safeParse({ ...validInput, quantity: '11' }))).toContain(
      'You can remove at most 10 (the current stock).',
    )
  })

  it('allows removing exactly the current stock', () => {
    expect(adjustmentSchema.safeParse({ ...validInput, quantity: '10' }).success).toBe(true)
  })

  it('allows adding any amount', () => {
    expect(
      adjustmentSchema.safeParse({ ...validInput, direction: 'add', quantity: '50' }).success,
    ).toBe(true)
  })

  it('requires a product', () => {
    const withoutProduct = { ...validInput, product_id: undefined }
    expect(messages(adjustmentSchema.safeParse(withoutProduct))).toContain('Choose a product.')
  })

  it('requires a reason', () => {
    const withoutReason = { ...validInput, reason: undefined }
    expect(messages(adjustmentSchema.safeParse(withoutReason))).toContain('Choose a reason.')
  })

  it('requires details when the reason is Other', () => {
    expect(messages(adjustmentSchema.safeParse({ ...validInput, reason: 'Other' }))).toContain(
      'Describe the reason.',
    )
  })

  it.each(['0', '-1', '2.5'])('rejects the quantity "%s"', (quantity) => {
    expect(adjustmentSchema.safeParse({ ...validInput, quantity }).success).toBe(false)
  })
})

describe('adjustment helpers', () => {
  const values = adjustmentSchema.parse({
    product_id: 4,
    current_stock: 10,
    direction: 'remove',
    quantity: '3',
    reason: 'Expired',
    notes: 'past date',
  })

  it('makes removals negative and additions positive', () => {
    expect(adjustmentQuantityChange(values)).toBe(-3)
    expect(adjustmentQuantityChange({ ...values, direction: 'add' })).toBe(3)
  })

  it('adds the details to the reason', () => {
    expect(adjustmentReasonText(values)).toBe('Expired: past date')
    expect(adjustmentReasonText({ ...values, notes: '' })).toBe('Expired')
  })
})
