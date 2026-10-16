import { StatusBadge } from '@/components/common/StatusBadge'
import { formatCurrency } from '@/lib/currency'

// Green when balanced or over, red when short (UI guide 6.7), always with a word.
export function CashDifference({ difference }: { difference: number }) {
  if (difference === 0) return <StatusBadge tone="success">Balanced</StatusBadge>
  if (difference > 0) {
    return <StatusBadge tone="success">Over {formatCurrency(difference)}</StatusBadge>
  }
  return <StatusBadge tone="danger">Short {formatCurrency(-difference)}</StatusBadge>
}
