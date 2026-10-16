import { StatusBadge } from '@/components/common/StatusBadge'
import type { SaleStatus } from '@/features/transactions/api'
import { saleStatusLabels, saleStatusTones } from '@/features/transactions/utils/saleStatus'

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <StatusBadge tone={saleStatusTones[status]}>{saleStatusLabels[status]}</StatusBadge>
}
