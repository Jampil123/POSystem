import { z } from 'zod'
import { moneyField, optionalMoneyField, wholeNumberField } from '@/lib/formFields'

// Matches the default in the products table.
export const DEFAULT_LOW_STOCK_LEVEL = 5

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter the product name.')
    .max(100, 'Keep the name under 100 characters.'),
  // Select values are text, so the id is turned into a number.
  category_id: z.string().min(1, 'Choose a category.').transform(Number),
  // Empty means no barcode. Uniqueness is checked by the database.
  barcode: z
    .string()
    .trim()
    .max(50, 'Keep the barcode under 50 characters.')
    .transform((value) => (value === '' ? null : value)),
  cost_price: optionalMoneyField(),
  selling_price: moneyField('Enter the selling price.'),
  low_stock_level: wholeNumberField('Enter the low-stock level.'),
  is_active: z.boolean(),
})

/** What the form fields hold (text). */
export type ProductFormInput = z.input<typeof productSchema>
/** What the form gives after checking (numbers, null barcode). */
export type ProductFormValues = z.output<typeof productSchema>

export const emptyProductForm: ProductFormInput = {
  name: '',
  category_id: '',
  barcode: '',
  cost_price: '',
  selling_price: '',
  low_stock_level: String(DEFAULT_LOW_STOCK_LEVEL),
  is_active: true,
}

// Selling below cost is allowed (e.g. a clearance sale), but the form shows a warning.
export function isPriceBelowCost(costPrice: string, sellingPrice: string): boolean {
  const cost = Number(costPrice)
  const price = Number(sellingPrice)
  if (costPrice.trim() === '' || sellingPrice.trim() === '') return false
  if (Number.isNaN(cost) || Number.isNaN(price)) return false
  return price < cost
}

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter the category name.')
    .max(50, 'Keep the name under 50 characters.'),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
