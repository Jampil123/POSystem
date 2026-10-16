import { ChevronRight } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TransactionListItem } from '@/features/transactions/api'
import { SaleStatusBadge } from '@/features/transactions/components/SaleStatusBadge'
import { formatManilaDateTime } from '@/lib/manilaTime'

type TransactionTableProps = {
  transactions: TransactionListItem[]
  onOpen: (saleId: number) => void
}

// Receipt number, date and time, cashier, items, total, status (UI guide 6.6).
// Table on tablets and desktops; one card per sale on phones.
export function TransactionTable({ transactions, onOpen }: TransactionTableProps) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Receipt</TableHead>
              <TableHead>Date and time</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="px-4">
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((sale) => (
              <TableRow key={sale.id} className="cursor-pointer" onClick={() => onOpen(sale.id)}>
                <TableCell className="px-4 font-medium tabular-nums">{sale.receipt_no}</TableCell>
                <TableCell className="tabular-nums">
                  {formatManilaDateTime(sale.created_at)}
                </TableCell>
                <TableCell>{sale.cashier?.full_name}</TableCell>
                <TableCell className="text-right tabular-nums">{sale.itemCount}</TableCell>
                <TableCell className="text-right">
                  <CurrencyText amount={sale.total} />
                </TableCell>
                <TableCell>
                  <SaleStatusBadge status={sale.status} />
                </TableCell>
                <TableCell className="px-4 text-right">
                  <Button
                    variant="outline"
                    className="h-12"
                    aria-label={`View receipt ${sale.receipt_no}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpen(sale.id)
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {transactions.map((sale) => (
          <li key={sale.id}>
            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border bg-card p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`View receipt ${sale.receipt_no}`}
              onClick={() => onOpen(sale.id)}
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium tabular-nums">#{sale.receipt_no}</span>
                  <SaleStatusBadge status={sale.status} />
                </span>
                <span className="block text-sm text-muted-foreground tabular-nums">
                  {formatManilaDateTime(sale.created_at)} · {sale.cashier?.full_name}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-right">
                  <CurrencyText amount={sale.total} className="block font-semibold" />
                  <span className="text-sm text-muted-foreground">
                    {sale.itemCount} {sale.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
