import { z } from 'zod'
import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from '@functions/_shared/userRules.ts'

const fullName = z
  .string()
  .trim()
  .min(1, 'Enter the full name.')
  .max(100, 'Keep the name under 100 characters.')

const role = z.enum(['admin', 'cashier'], 'Choose a role.')

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(72, 'Keep the password under 72 characters.')

const passwordsMatch = {
  path: ['confirm_password'],
  message: 'The two passwords do not match.',
}

export const newUserSchema = z
  .object({
    full_name: fullName,
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Enter a username.')
      .regex(USERNAME_PATTERN, 'Use 3 to 30 letters, numbers, dots, dashes, or underscores.'),
    password,
    confirm_password: z.string(),
    role,
  })
  .refine((values) => values.password === values.confirm_password, passwordsMatch)

export type NewUserValues = z.infer<typeof newUserSchema>

export const editUserSchema = z.object({ full_name: fullName, role })

export type EditUserValues = z.infer<typeof editUserSchema>

export const resetPasswordSchema = z
  .object({ password, confirm_password: z.string() })
  .refine((values) => values.password === values.confirm_password, passwordsMatch)

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
