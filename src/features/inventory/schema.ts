import { format } from 'date-fns'
import { z } from 'zod'
import { moneyField, wholeNumberField } from '@/lib/formFields'

/** Today's date as yyyy-MM-dd, the format of <input type="date">. */
export function todayDateString(now: Date = new Date()): string {
  return format(now, 'yyyy-MM-dd')
}

// ---------------------------------------------------------------------------
// Stock in
// ---------------------------------------------------------------------------

export const stockInItemSchema = z.object({
  product_id: z.number(),
  /** Shown in the list only; not sent to the database. */
  product_name: z.string(),
  quantity: wholeNumberField('Enter the quantity.', 1),
  unit_cost: moneyField('Enter the unit cost.'),
})

export const stockInSchema = z.object({
  supplier_name: z.string().trim().max(100, 'Keep the supplier name under 100 characters.'),
  received_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose the date the stock was received.')
    .refine((date) => date <= todayDateString(), 'The date cannot be in the future.'),
  items: z.array(stockInItemSchema).min(1, 'Add at least one item.'),
})

export type StockInFormInput = z.input<typeof stockInSchema>
export type StockInValues = z.output<typeof stockInSchema>

// ---------------------------------------------------------------------------
// Stock adjustment
// ---------------------------------------------------------------------------

export const ADJUSTMENT_REASONS = ['Damaged', 'Expired', 'Count correction', 'Other'] as const

export const adjustmentSchema = z
  .object({
    product_id: z.number('Choose a product.'),
    /** Stock of the chosen product, used to block a negative result. */
    current_stock: z.number(),
    direction: z.enum(['add', 'remove']),
    quantity: wholeNumberField('Enter the quantity.', 1),
    reason: z.enum(ADJUSTMENT_REASONS, 'Choose a reason.'),
    notes: z.string().trim().max(200, 'Keep the details under 200 characters.'),
  })
  .superRefine((values, context) => {
    if (values.direction === 'remove' && values.quantity > values.current_stock) {
      context.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: `You can remove at most ${values.current_stock} (the current stock).`,
      })
    }
    if (values.reason === 'Other' && values.notes === '') {
      context.addIssue({ code: 'custom', path: ['notes'], message: 'Describe the reason.' })
    }
  })

export type AdjustmentFormInput = z.input<typeof adjustmentSchema>
export type AdjustmentValues = z.output<typeof adjustmentSchema>

/** Positive adds stock, negative removes it. */
export function adjustmentQuantityChange(values: AdjustmentValues): number {
  return values.direction === 'remove' ? -values.quantity : values.quantity
}

/** The reason saved in the database, e.g. "Damaged: dropped box". */
export function adjustmentReasonText(values: AdjustmentValues): string {
  return values.notes ? `${values.reason}: ${values.notes}` : values.reason
}
