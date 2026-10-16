import type { StatusTone } from '@/components/common/StatusBadge'
import type { SaleStatus } from '@/features/transactions/api'

export const saleStatusLabels: Record<SaleStatus, string> = {
  completed: 'Completed',
  voided: 'Voided',
  refunded: 'Refunded',
}

export const saleStatusTones: Record<SaleStatus, StatusTone> = {
  completed: 'success',
  voided: 'danger',
  refunded: 'neutral',
}
