import type { ReactNode } from 'react'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReportSummary } from '@/features/reports/api'
import { formatCurrency } from '@/lib/currency'

type SummaryCardsProps = {
  summary: ReportSummary | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

// Total sales, transactions, items sold, average sale, low-stock items, and gross profit.
export function SummaryCards({ summary, isPending, isError, onRetry }: SummaryCardsProps) {
  if (isError) return <ErrorState message="Could not load the summary." onRetry={onRetry} />

  if (isPending || !summary) {
    return (
      <div role="status" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <span className="sr-only">Loading…</span>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-24 bg-muted" />
        ))}
      </div>
    )
  }

  const profitNote =
    summary.grossProfit === null
      ? 'No cost data'
      : summary.salesWithoutCost > 0
        ? `${summary.salesWithoutCost} older ${summary.salesWithoutCost === 1 ? 'sale has' : 'sales have'} no cost data`
        : 'Sales minus cost'

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Card
        label="Total sales"
        note={summary.refunds > 0 ? `After ${formatCurrency(summary.refunds)} refunds` : undefined}
      >
        {formatCurrency(summary.totalSales)}
      </Card>
      <Card label="Transactions">{summary.transactionCount}</Card>
      <Card label="Items sold">{summary.itemsSold}</Card>
      <Card label="Average sale">{formatCurrency(summary.averageSale)}</Card>
      <Card label="Low-stock items" note="Now, at or below their low-stock level">
        {summary.lowStockCount}
      </Card>
      <Card label="Gross profit" note={profitNote}>
        {summary.grossProfit === null ? '—' : formatCurrency(summary.grossProfit)}
      </Card>
    </dl>
  )
}

function Card({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">{children}</dd>
      {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
    </div>
  )
}
