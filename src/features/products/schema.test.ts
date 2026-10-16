import {
  categorySchema,
  emptyProductForm,
  isPriceBelowCost,
  productSchema,
  type ProductFormInput,
} from '@/features/products/schema'

const validInput: ProductFormInput = {
  ...emptyProductForm,
  name: 'Softdrinks 1L',
  category_id: '3',
  barcode: '2000000000011',
  cost_price: '52',
  selling_price: '65.00',
}

function errorFor(input: ProductFormInput, field: keyof ProductFormInput) {
  const result = productSchema.safeParse(input)
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('productSchema', () => {
  it('turns valid text into numbers', () => {
    expect(productSchema.parse(validInput)).toEqual({
      name: 'Softdrinks 1L',
      category_id: 3,
      barcode: '2000000000011',
      cost_price: 52,
      selling_price: 65,
      low_stock_level: 5,
      is_active: true,
    })
  })

  it('defaults the low-stock level to 5', () => {
    expect(emptyProductForm.low_stock_level).toBe('5')
  })

  it('requires a name', () => {
    expect(errorFor({ ...validInput, name: '   ' }, 'name')).toBe('Enter the product name.')
  })

  it('requires a category', () => {
    expect(errorFor({ ...validInput, category_id: '' }, 'category_id')).toBe('Choose a category.')
  })

  it('requires a selling price', () => {
    expect(errorFor({ ...validInput, selling_price: '' }, 'selling_price')).toBe(
      'Enter the selling price.',
    )
  })

  it.each(['-5', '-0.50'])('rejects a negative selling price (%s)', (price) => {
    expect(errorFor({ ...validInput, selling_price: price }, 'selling_price')).toMatch(/0 or more/)
  })

  it('rejects a negative cost price', () => {
    expect(errorFor({ ...validInput, cost_price: '-1' }, 'cost_price')).toMatch(/0 or more/)
  })

  it('rejects more than 2 decimals and words', () => {
    expect(errorFor({ ...validInput, selling_price: '10.555' }, 'selling_price')).toBeDefined()
    expect(errorFor({ ...validInput, selling_price: 'abc' }, 'selling_price')).toBeDefined()
  })

  it('treats an empty cost price as 0', () => {
    expect(productSchema.parse({ ...validInput, cost_price: '' }).cost_price).toBe(0)
  })

  it('treats an empty barcode as no barcode', () => {
    expect(productSchema.parse({ ...validInput, barcode: '  ' }).barcode).toBeNull()
  })

  it('requires a whole-number low-stock level', () => {
    expect(errorFor({ ...validInput, low_stock_level: '2.5' }, 'low_stock_level')).toBeDefined()
    expect(errorFor({ ...validInput, low_stock_level: '-1' }, 'low_stock_level')).toBeDefined()
  })
})

describe('isPriceBelowCost', () => {
  it('warns when the selling price is lower than the cost', () => {
    expect(isPriceBelowCost('52', '50')).toBe(true)
  })

  it('does not warn when the price equals or is above the cost', () => {
    expect(isPriceBelowCost('52', '52')).toBe(false)
    expect(isPriceBelowCost('52', '65')).toBe(false)
  })

  it('does not warn while a field is empty or not a number', () => {
    expect(isPriceBelowCost('', '10')).toBe(false)
    expect(isPriceBelowCost('52', '')).toBe(false)
    expect(isPriceBelowCost('abc', '10')).toBe(false)
  })
})

describe('categorySchema', () => {
  it('trims the name', () => {
    expect(categorySchema.parse({ name: '  Snacks ' })).toEqual({ name: 'Snacks' })
  })

  it('requires a name', () => {
    expect(categorySchema.safeParse({ name: ' ' }).success).toBe(false)
  })
})
