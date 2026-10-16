import { z } from 'zod'

// Same rule as the profiles.username check in the database.
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter your username.')
    .regex(
      USERNAME_PATTERN,
      'Usernames have 3 to 30 letters, numbers, dots, dashes, or underscores.',
    ),
  password: z.string().min(1, 'Enter your password.'),
})

export type LoginValues = z.infer<typeof loginSchema>

// Same rule as set_approval_pin in the database.
export const PIN_PATTERN = /^\d{4,6}$/

export const approvalPinSchema = z
  .object({
    pin: z.string().regex(PIN_PATTERN, 'The PIN must be 4 to 6 digits.'),
    confirm_pin: z.string().min(1, 'Type the PIN again.'),
  })
  .refine((values) => values.pin === values.confirm_pin, {
    path: ['confirm_pin'],
    message: 'The two PINs do not match.',
  })

export type ApprovalPinValues = z.infer<typeof approvalPinSchema>
