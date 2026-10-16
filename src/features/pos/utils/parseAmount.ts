const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

/**
 * Reads an amount typed by the cashier, like "200" or "105.50".
 * Returns null when the text is empty or not a valid amount of 0 or more
 * with up to 2 decimals.
 */
export function parseAmount(text: string): number | null {
  const trimmed = text.trim()
  if (!AMOUNT_PATTERN.test(trimmed)) return null
  return Number(trimmed)
}
