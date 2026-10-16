import { BarChart3 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import type { DailySales } from '@/features/reports/api'
import { formatCurrency } from '@/lib/currency'

// Value labels on the bars only when there is room for them.
const MAX_LABELED_DAYS = 10
// Each day gets at least this much width; longer ranges scroll sideways on small screens.
const MIN_DAY_WIDTH = 36

const compactPeso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

/** "2026-10-16" -> "Oct 16" */
function formatDay(day: string) {
  const [year, month, date] = day.split('-').map(Number)
  return dayFormatter.format(new Date(Date.UTC(year, month - 1, date)))
}

type SalesChartProps = {
  days: DailySales[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

// Sales per day: yellow bars with dark labels (UI guide 6.8). One series, so no legend.
// Yellow is light on white, so the numbers are also shown as labels, a tooltip, and a table.
export function SalesChart({ days, isPending, isError, onRetry }: SalesChartProps) {
  return (
    <section aria-labelledby="sales-chart-title" className="rounded-lg border bg-card p-4">
      <h2 id="sales-chart-title" className="text-lg font-semibold">
        Sales per day
      </h2>

      <div className="mt-3">
        {isError ? (
          <ErrorState message="Could not load the chart." onRetry={onRetry} />
        ) : isPending || !days ? (
          <Skeleton role="status" aria-label="Loading" className="h-64 bg-muted" />
        ) : days.every((day) => day.totalSales === 0 && day.transactionCount === 0) ? (
          <EmptyState icon={BarChart3} message="No sales in this date range." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <div style={{ minWidth: days.length * MIN_DAY_WIDTH }} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={days} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={formatDay}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(value: number) => compactPeso.format(value)}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)' }}
                      content={({ active, payload }) => (
                        <DayTooltip
                          active={active}
                          day={payload?.[0]?.payload as DailySales | undefined}
                        />
                      )}
                    />
                    <Bar
                      dataKey="totalSales"
                      name="Sales"
                      fill="var(--chart-1)"
                      maxBarSize={24}
                      radius={[4, 4, 0, 0]}
                    >
                      {days.length <= MAX_LABELED_DAYS && (
                        <LabelList
                          dataKey="totalSales"
                          position="top"
                          formatter={(value) =>
                            typeof value === 'number' && value !== 0
                              ? compactPeso.format(value)
                              : ''
                          }
                          style={{ fill: 'var(--foreground)', fontSize: 12 }}
                        />
                      )}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <details className="mt-3 text-sm">
              <summary className="min-h-12 cursor-pointer py-3 font-medium">Show as table</summary>
              <table className="w-full max-w-md tabular-nums">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 font-medium">Day</th>
                    <th className="py-2 text-right font-medium">Transactions</th>
                    <th className="py-2 text-right font-medium">Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.day} className="border-b last:border-0">
                      <td className="py-2">{formatDay(day.day)}</td>
                      <td className="py-2 text-right">{day.transactionCount}</td>
                      <td className="py-2 text-right">{formatCurrency(day.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </div>
    </section>
  )
}

function DayTooltip({ active, day }: { active?: boolean; day?: DailySales }) {
  if (!active || !day) return null

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{formatDay(day.day)}</p>
      <p className="tabular-nums">{formatCurrency(day.totalSales)}</p>
      <p className="text-muted-foreground tabular-nums">
        {day.transactionCount} {day.transactionCount === 1 ? 'transaction' : 'transactions'}
      </p>
    </div>
  )
}
