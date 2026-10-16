import type { StatusTone } from '@/components/common/StatusBadge'

export type StockStatus = 'in' | 'low' | 'out'

// Out: no stock left. Low: at or below the product's low-stock level. In stock: above it.
export function getStockStatus(stockQty: number, lowStockLevel: number): StockStatus {
  if (stockQty <= 0) return 'out'
  if (stockQty <= lowStockLevel) return 'low'
  return 'in'
}

export const stockStatusLabels: Record<StockStatus, string> = {
  in: 'In stock',
  low: 'Low',
  out: 'Out',
}

export const stockStatusTones: Record<StockStatus, StatusTone> = {
  in: 'success',
  low: 'warning',
  out: 'danger',
}
