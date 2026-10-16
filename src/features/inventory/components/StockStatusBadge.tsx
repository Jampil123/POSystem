import { StatusBadge } from '@/components/common/StatusBadge'
import {
  getStockStatus,
  stockStatusLabels,
  stockStatusTones,
} from '@/features/inventory/utils/stockStatus'

export function StockStatusBadge({
  stockQty,
  lowStockLevel,
}: {
  stockQty: number
  lowStockLevel: number
}) {
  const status = getStockStatus(stockQty, lowStockLevel)
  return <StatusBadge tone={stockStatusTones[status]}>{stockStatusLabels[status]}</StatusBadge>
}
