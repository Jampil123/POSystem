import { z } from 'zod'
import { PIN_PATTERN, USERNAME_PATTERN } from '@/features/auth/schema'

// Void or refund: a reason, and the approving admin's username and PIN.
export const voidRefundSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Enter the reason.')
    .max(200, 'Keep the reason under 200 characters.'),
  admin_username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter the admin's username.")
    .regex(USERNAME_PATTERN, 'Enter a valid username.'),
  admin_pin: z.string().regex(PIN_PATTERN, 'The PIN is 4 to 6 digits.'),
})

export type VoidRefundValues = z.infer<typeof voidRefundSchema>
