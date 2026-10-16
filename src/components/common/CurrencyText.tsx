import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'

// Money shown as ₱1,250.00 with numbers that line up in columns.
export function CurrencyText({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn('tabular-nums', className)}>{formatCurrency(amount)}</span>
}
