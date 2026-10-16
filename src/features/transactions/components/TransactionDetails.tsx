import { useState } from 'react'
import { Ban, Printer, Undo2 } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ReceiptDialog } from '@/features/pos/components/ReceiptDialog'
import type { TransactionDetails as Details } from '@/features/transactions/api'
import { SaleStatusBadge } from '@/features/transactions/components/SaleStatusBadge'
import { VoidRefundDialog } from '@/features/transactions/components/VoidRefundDialog'
import { useTransaction } from '@/features/transactions/hooks/useTransactions'
import { formatManilaDateTime } from '@/lib/manilaTime'

type TransactionDetailsProps = {
  /** The sale to show; null closes the panel. */
  saleId: number | null
  onClose: () => void
}

// Side panel (full screen on phones) with the items, totals, status, and actions.
export function TransactionDetails({ saleId, onClose }: TransactionDetailsProps) {
  const sale = useTransaction(saleId)

  return (
    <Sheet open={saleId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">
            {sale.data ? `Receipt ${sale.data.receipt_no}` : 'Transaction'}
          </SheetTitle>
          <SheetDescription>
            {sale.data ? formatManilaDateTime(sale.data.created_at) : 'Loading…'}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          {sale.isPending ? (
            <ListSkeleton rows={6} />
          ) : sale.isError ? (
            <ErrorState
              message="Could not load the transaction."
              onRetry={() => void sale.refetch()}
            />
          ) : (
            <DetailsBody sale={sale.data} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailsBody({ sale }: { sale: Details }) {
  const [reprinting, setReprinting] = useState(false)
  const [reversal, setReversal] = useState<'void' | 'refund' | null>(null)

  // Void while the sale's shift is open; refund after it is closed.
  const shiftOpen = sale.shift?.closed_at === null
  const canVoid = sale.status === 'completed' && shiftOpen
  const canRefund = sale.status === 'completed' && !shiftOpen

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-1">
            <SaleStatusBadge status={sale.status} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cashier</dt>
          <dd className="mt-1 font-medium">{sale.cashier?.full_name}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Shift</dt>
          <dd className="mt-1">
            #{sale.shift?.id} · opened {sale.shift && formatManilaDateTime(sale.shift.opened_at)}
            {sale.shift?.closed_at ? ' (closed)' : ' (open)'}
          </dd>
        </div>
      </dl>

      {sale.reversal && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-semibold">
            {sale.reversal.type === 'void' ? 'Voided' : 'Refunded'} on{' '}
            {formatManilaDateTime(sale.reversal.created_at)}
          </p>
          <p>Reason: {sale.reversal.reason}</p>
          <p>Approved by: {sale.reversal.approver?.full_name}</p>
          {sale.reversal.requester && <p>Requested by: {sale.reversal.requester.full_name}</p>}
        </div>
      )}

      <section aria-label="Items">
        <ul className="divide-y rounded-lg border">
          {sale.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 p-3 text-sm">
              <span className="min-w-0">
                <span className="block font-medium">{item.product_name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {item.quantity} × <CurrencyText amount={item.unit_price} />
                </span>
              </span>
              <CurrencyText amount={item.line_total} className="font-medium" />
            </li>
          ))}
        </ul>
      </section>

      <dl className="grid gap-1 text-sm">
        <AmountRow label="Subtotal" amount={sale.subtotal} />
        {sale.discount > 0 && <AmountRow label="Discount" amount={-sale.discount} />}
        {sale.vat_amount > 0 && <AmountRow label="VAT (included)" amount={sale.vat_amount} />}
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>
            <CurrencyText amount={sale.total} />
          </dd>
        </div>
        <AmountRow label="Cash received" amount={sale.cash_received} />
        <AmountRow label="Change" amount={sale.change} />
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="h-12 flex-1" onClick={() => setReprinting(true)}>
          <Printer aria-hidden="true" />
          Reprint receipt
        </Button>
        {canVoid && (
          <Button
            variant="outline"
            className="h-12 flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setReversal('void')}
          >
            <Ban aria-hidden="true" />
            Void
          </Button>
        )}
        {canRefund && (
          <Button
            variant="outline"
            className="h-12 flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setReversal('refund')}
          >
            <Undo2 aria-hidden="true" />
            Refund
          </Button>
        )}
      </div>
      {sale.status === 'completed' && (
        <p className="text-xs text-muted-foreground">
          {shiftOpen
            ? 'Void is for mistakes while the shift is still open.'
            : 'The shift is closed, so this sale can only be refunded.'}
        </p>
      )}

      <ReceiptDialog
        saleId={reprinting ? sale.id : null}
        reprint
        onClose={() => setReprinting(false)}
      />
      <VoidRefundDialog type={reversal} sale={sale} onClose={() => setReversal(null)} />
    </div>
  )
}

function AmountRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <CurrencyText amount={amount} />
      </dd>
    </div>
  )
}
