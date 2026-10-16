import { z } from 'zod'

// Zod fields for form inputs. Inputs give text, so these check the text and
// turn it into a number. They only check the format; they do not round.

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/
const WHOLE_NUMBER_PATTERN = /^\d+$/

/** Largest value numeric(10,2) can hold. */
export const MAX_MONEY = 99_999_999.99
export const MAX_QUANTITY = 1_000_000

const moneyFormatMessage = 'Enter an amount of 0 or more, like 25 or 25.50.'

/** Required peso amount, 0 or more, up to 2 decimals. */
export function moneyField(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(MONEY_PATTERN, moneyFormatMessage)
    .transform(Number)
    .refine((value) => value <= MAX_MONEY, 'This amount is too large.')
}

/** Optional peso amount; empty means 0. */
export function optionalMoneyField() {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || MONEY_PATTERN.test(value), moneyFormatMessage)
    .transform((value) => (value === '' ? 0 : Number(value)))
    .refine((value) => value <= MAX_MONEY, 'This amount is too large.')
}

/** Required whole number from `min` up to MAX_QUANTITY. */
export function wholeNumberField(requiredMessage: string, min = 0) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(WHOLE_NUMBER_PATTERN, 'Enter a whole number, like 5.')
    .transform(Number)
    .refine((value) => value >= min, `Enter ${min} or more.`)
    .refine((value) => value <= MAX_QUANTITY, 'This number is too large.')
}
