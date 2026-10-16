import type { ReportExportData } from '@/features/reports/api'
import { formatAmount } from '@/lib/currency'
import { formatManilaDateTime } from '@/lib/manilaTime'

// The rows shared by the Excel and PDF exports, so both files show the same numbers.
// Money is written as "1,250.00" (PDF fonts cannot print the peso sign).

export type ReportTable = {
  title: string
  head: string[]
  body: (string | number)[][]
}

function money(amount: number | null): string {
  return amount === null ? '—' : formatAmount(amount)
}

export function reportTables(data: ReportExportData): ReportTable[] {
  const { summary } = data

  return [
    {
      title: 'Sales summary',
      head: ['Item', 'Value'],
      body: [
        ['Total sales (PHP)', money(summary.totalSales)],
        ['Transactions', summary.transactionCount],
        ['Items sold', summary.itemsSold],
        ['Average sale (PHP)', money(summary.averageSale)],
        ['Refunds (PHP)', money(summary.refunds)],
        [
          'Gross profit (PHP)',
          summary.grossProfit === null ? 'No cost data' : money(summary.grossProfit),
        ],
        ['Sales without cost data', summary.salesWithoutCost],
        ['Low-stock items', summary.lowStockCount],
      ],
    },
    {
      title: 'Best sellers',
      head: ['Product', 'Quantity', 'Sales (PHP)'],
      body: data.bestSellers.map((item) => [item.name, item.quantity, money(item.sales)]),
    },
    {
      title: 'Low stock',
      head: ['Product', 'Category', 'Stock', 'Low-stock level'],
      body: data.lowStock.map((item) => [
        item.name,
        item.category,
        item.stockQty,
        item.lowStockLevel,
      ]),
    },
    {
      title: 'Shift summary',
      head: ['Cashier', 'Opened', 'Closed', 'Expected (PHP)', 'Actual (PHP)', 'Difference (PHP)'],
      body: data.shifts.map((shift) => [
        shift.cashier,
        formatManilaDateTime(shift.openedAt),
        shift.closedAt ? formatManilaDateTime(shift.closedAt) : 'Open',
        money(shift.expectedCash),
        money(shift.actualCash),
        money(shift.difference),
      ]),
    },
  ]
}
