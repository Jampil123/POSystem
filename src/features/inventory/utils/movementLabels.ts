import type { Enums } from '@/types/database'

export type MovementType = Enums<'movement_type'>

export const movementTypeLabels: Record<MovementType, string> = {
  stock_in: 'Stock in',
  sale: 'Sale',
  adjustment: 'Adjustment',
  void: 'Void',
  refund: 'Refund',
}

/** +5 for stock added, −3 (with a real minus sign) for stock removed. */
export function formatQuantityChange(quantityChange: number): string {
  return quantityChange > 0 ? `+${quantityChange}` : `−${Math.abs(quantityChange)}`
}
