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
