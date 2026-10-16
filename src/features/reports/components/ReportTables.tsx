import type { ReactNode } from 'react'
import { Clock, PackageCheck, Trophy } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StockStatusBadge } from '@/features/inventory/components/StockStatusBadge'
import type { BestSeller, LowStockItem, ShiftSummaryRow } from '@/features/reports/api'
import { CashDifference } from '@/features/shifts/components/CashDifference'
import { formatManilaDateTime } from '@/lib/manilaTime'

type QueryState<T> = {
  data: T[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

// Section with a title and the loading, error, and empty states shared by the report tables.
function ReportSection<T>({
  title,
  state,
  emptyIcon,
  emptyMessage,
  children,
}: {
  title: string
  state: QueryState<T>
  emptyIcon: typeof Trophy
  emptyMessage: string
  children: (rows: T[]) => ReactNode
}) {
  const id = `report-${title.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {state.isError ? (
        <ErrorState message={`Could not load ${title.toLowerCase()}.`} onRetry={state.onRetry} />
      ) : state.isPending || !state.data ? (
        <ListSkeleton rows={4} />
      ) : state.data.length === 0 ? (
        <EmptyState icon={emptyIcon} message={emptyMessage} />
      ) : (
        children(state.data)
      )}
    </section>
  )
}

export function BestSellersTable(state: QueryState<BestSeller>) {
  return (
    <ReportSection
      title="Best sellers"
      state={state}
      emptyIcon={Trophy}
      emptyMessage="No items sold in this date range."
    >
      {(rows) => (
        <>
          <div className="hidden rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="px-4 text-right">Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item, index) => (
                  <TableRow key={item.productId}>
                    <TableCell className="px-4 tabular-nums">{index + 1}</TableCell>
                    <TableCell className="font-medium whitespace-normal">{item.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="px-4 text-right">
                      <CurrencyText amount={item.sales} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ol className="flex flex-col gap-2 md:hidden">
            {rows.map((item, index) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
              >
                <span className="min-w-0">
                  <span className="font-medium">
                    {index + 1}. {item.name}
                  </span>
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {item.quantity} sold
                  </span>
                </span>
                <CurrencyText amount={item.sales} className="font-semibold" />
              </li>
            ))}
          </ol>
          <p className="text-xs text-muted-foreground">Sales are item amounts before discounts.</p>
        </>
      )}
    </ReportSection>
  )
}

export function LowStockList(state: QueryState<LowStockItem>) {
  return (
    <ReportSection
      title="Low stock"
      state={state}
      emptyIcon={PackageCheck}
      emptyMessage="No items are low on stock."
    >
      {(rows) => (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {rows.map((item) => (
            <li key={item.productId} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0">
                <span className="block font-medium">{item.name}</span>
                <span className="text-sm text-muted-foreground">
                  {item.category} · low at {item.lowStockLevel}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-semibold tabular-nums">{item.stockQty}</span>
                <StockStatusBadge stockQty={item.stockQty} lowStockLevel={item.lowStockLevel} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </ReportSection>
  )
}

function Money({ amount }: { amount: number | null }) {
  return amount === null ? <span>—</span> : <CurrencyText amount={amount} />
}

function ShiftResult({ shift }: { shift: ShiftSummaryRow }) {
  return shift.difference === null ? (
    <StatusBadge tone="warning">Open</StatusBadge>
  ) : (
    <CashDifference difference={shift.difference} />
  )
}

export function ShiftSummaryTable(state: QueryState<ShiftSummaryRow>) {
  return (
    <ReportSection
      title="Shift summary"
      state={state}
      emptyIcon={Clock}
      emptyMessage="No shifts were opened in this date range."
    >
      {(rows) => (
        <>
          <div className="hidden rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Cashier</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="px-4">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((shift) => (
                  <TableRow key={shift.shiftId}>
                    <TableCell className="px-4 font-medium">{shift.cashier}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatManilaDateTime(shift.openedAt)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {shift.closedAt ? formatManilaDateTime(shift.closedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={shift.expectedCash} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={shift.actualCash} />
                    </TableCell>
                    <TableCell className="px-4">
                      <ShiftResult shift={shift} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((shift) => (
              <li key={shift.shiftId} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-medium">{shift.cashier}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatManilaDateTime(shift.openedAt)}
                    </span>
                  </span>
                  <ShiftResult shift={shift} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Expected</dt>
                    <dd>
                      <Money amount={shift.expectedCash} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Actual</dt>
                    <dd>
                      <Money amount={shift.actualCash} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </ReportSection>
  )
}
