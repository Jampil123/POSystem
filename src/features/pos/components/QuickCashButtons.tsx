import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/currency'

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000]

type QuickCashButtonsProps = {
  total: number
  onPick: (amount: number) => void
}

// ₱20, ₱50, ₱100, ₱200, ₱500, ₱1,000, and Exact amount. Three per row on phones.
export function QuickCashButtons({ total, onPick }: QuickCashButtonsProps) {
  return (
    <div
      role="group"
      aria-label="Quick cash amounts"
      className="grid grid-cols-3 gap-2 xl:grid-cols-4"
    >
      {QUICK_AMOUNTS.map((amount) => (
        <Button
          key={amount}
          type="button"
          variant="outline"
          className="h-12 text-base tabular-nums"
          onClick={() => onPick(amount)}
        >
          {formatCurrency(amount).replace('.00', '')}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        className="col-span-3 h-12 text-base xl:col-span-2"
        disabled={total <= 0}
        onClick={() => onPick(total)}
      >
        Exact amount
      </Button>
    </div>
  )
}
