import { Loader2 } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuickCashButtons } from '@/features/pos/components/QuickCashButtons'
import { usePosTotals } from '@/features/pos/hooks/usePosTotals'
import { useCartStore } from '@/features/pos/store/cartStore'
import { formatCurrency } from '@/lib/currency'

type PaymentPanelProps = {
  onComplete: () => void
  isSaving: boolean
}

// Step 3 (cash only): total, cash received with quick amounts, live change, and Complete sale.
export function PaymentPanel({ onComplete, isSaving }: PaymentPanelProps) {
  const cashReceived = useCartStore((state) => state.cashReceived)
  const setCashReceived = useCartStore((state) => state.setCashReceived)
  const { totals, cash, change, canComplete, hasProblems, discountError } = usePosTotals()

  const cashIsInvalid = cashReceived.trim() !== '' && cash === null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <span className="text-base font-semibold">Total</span>
        <CurrencyText amount={totals.total} className="text-4xl font-bold" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="pos-cash">Cash received (₱)</Label>
        <Input
          id="pos-cash"
          className="h-14 text-2xl font-semibold"
          inputMode="decimal"
          placeholder="0.00"
          autoComplete="off"
          aria-invalid={cashIsInvalid}
          aria-describedby="pos-change"
          value={cashReceived}
          onChange={(event) => setCashReceived(event.target.value)}
        />
        {cashIsInvalid && (
          <p className="text-sm text-destructive">Enter an amount like 200 or 105.50.</p>
        )}
      </div>

      <QuickCashButtons
        total={totals.total}
        onPick={(amount) => setCashReceived(amount.toFixed(2))}
      />

      <div id="pos-change" role="status" aria-live="polite">
        {cash === null ? (
          <p className="rounded-lg border bg-muted p-4 text-center text-muted-foreground">
            Enter the cash received.
          </p>
        ) : change.isEnough ? (
          <p className="flex items-center justify-between gap-3 rounded-lg border border-success/40 bg-success/10 p-4">
            <span className="font-semibold">Change</span>
            <CurrencyText amount={change.change} className="text-3xl font-bold text-success" />
          </p>
        ) : (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <span className="block text-xl font-bold">Insufficient cash</span>
            <span className="text-sm">{formatCurrency(change.shortBy)} more is needed.</span>
          </p>
        )}
      </div>

      {(hasProblems || discountError) && (
        <p className="text-sm text-destructive">
          Fix the cart in Step 2 before completing the sale.
        </p>
      )}

      <Button className="h-14 text-lg" disabled={!canComplete || isSaving} onClick={onComplete}>
        {isSaving && <Loader2 className="animate-spin" aria-hidden="true" />}
        {isSaving ? 'Saving sale…' : 'Complete sale'}
      </Button>
    </div>
  )
}
