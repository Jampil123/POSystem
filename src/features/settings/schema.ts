import { z } from 'zod'
import { wholeNumberField } from '@/lib/formFields'

export const settingsSchema = z.object({
  store_name: z
    .string()
    .trim()
    .min(1, 'Enter the store name.')
    .max(100, 'Keep the name under 100 characters.'),
  address: z.string().trim().max(200, 'Keep the address under 200 characters.'),
  contact_no: z.string().trim().max(50, 'Keep the contact number under 50 characters.'),
  vat_enabled: z.boolean(),
  vat_rate: z
    .string()
    .trim()
    .regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter a rate like 12 or 12.5.')
    .transform(Number)
    .refine((rate) => rate <= 100, 'The VAT rate cannot be more than 100%.'),
  receipt_footer: z.string().trim().max(300, 'Keep the footer under 300 characters.'),
  receipt_paper_width: z
    .enum(['58', '80'], 'Choose a paper width.')
    .transform((width): 58 | 80 => (width === '80' ? 80 : 58)),
  default_low_stock_level: wholeNumberField('Enter the default low-stock level.'),
})

/** What the form fields hold (text). */
export type SettingsInput = z.input<typeof settingsSchema>
/** What is saved (numbers). */
export type SettingsValues = z.output<typeof settingsSchema>
