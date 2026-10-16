import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { CurrencyText } from '@/components/common/CurrencyText'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePosTotals } from '@/features/pos/hooks/usePosTotals'
import { cartItemProblem, useCartStore, type CartItem } from '@/features/pos/store/cartStore'
import { computeLineTotal, type DiscountType } from '@/features/pos/utils/computeTotals'
import { cn } from '@/lib/utils'

type CartListProps = {
  onClear: () => void
  onNext: () => void
}

// Step 2: cart rows, discount, subtotal, VAT, and the total.
export function CartList({ onClear, onNext }: CartListProps) {
  const { items, discountType, discountValue, setDiscount } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      discountType: state.discountType,
      discountValue: state.discountValue,
      setDiscount: state.setDiscount,
    })),
  )
  const { totals, discountError, vatRate, hasProblems } = usePosTotals()

  if (items.length === 0) {
    return <EmptyState icon={ShoppingCart} message="The cart is empty. Add items in Step 1." />
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <CartRow key={item.productId} item={item} />
        ))}
      </ul>

      {hasProblems && (
        <p role="alert" className="text-sm text-destructive">
          Some items do not have enough stock. Lower the quantity or remove them.
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="pos-discount">Discount (optional)</Label>
        <div className="flex gap-2">
          <div role="group" aria-label="Discount type" className="flex shrink-0 gap-1">
            {(['amount', 'percent'] as DiscountType[]).map((type) => (
              <Button
                key={type}
                type="button"
                variant="outline"
                aria-pressed={discountType === type}
                aria-label={type === 'amount' ? 'Discount in pesos' : 'Discount in percent'}
                className={cn('size-12', discountType === type && 'border-primary bg-accent')}
                onClick={() => setDiscount(type, discountValue)}
              >
                {type === 'amount' ? '₱' : '%'}
              </Button>
            ))}
          </div>
          <Input
            id="pos-discount"
            className="h-12 text-base"
            inputMode="decimal"
            placeholder={discountType === 'amount' ? '0.00' : '0'}
            autoComplete="off"
            aria-invalid={discountError !== null}
            aria-describedby={discountError ? 'pos-discount-error' : undefined}
            value={discountValue}
            onChange={(event) => setDiscount(discountType, event.target.value)}
          />
        </div>
        {discountError && (
          <p id="pos-discount-error" className="text-sm text-destructive">
            {discountError}
          </p>
        )}
      </div>

      <dl className="grid gap-1 border-t pt-3 text-sm">
        <TotalRow label="Subtotal" amount={totals.subtotal} />
        {totals.discount > 0 && <TotalRow label="Discount" amount={-totals.discount} />}
        {totals.vatAmount > 0 && (
          <TotalRow label={`VAT (${vatRate}%, included)`} amount={totals.vatAmount} />
        )}
        <div className="mt-2 flex items-end justify-between gap-3">
          <dt className="text-base font-semibold">Total</dt>
          <dd className="text-4xl font-bold">
            <CurrencyText amount={totals.total} />
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-12 text-base" onClick={onClear}>
          Clear cart
        </Button>
        <Button className="h-12 text-base" onClick={onNext}>
          Next: Payment
        </Button>
      </div>
    </div>
  )
}

function TotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <CurrencyText amount={amount} />
      </dd>
    </div>
  )
}

function CartRow({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCartStore(
    useShallow((state) => ({ setQuantity: state.setQuantity, removeItem: state.removeItem })),
  )
  const problem = cartItemProblem(item)

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-2',
        problem && 'border-destructive bg-destructive/5',
      )}
    >
      <div className="min-w-0 flex-1 basis-32">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          <CurrencyText amount={item.unitPrice} /> each
        </p>
        {problem && <p className="text-sm font-medium text-destructive">{problem}</p>}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          className="size-12"
          aria-label={`One less ${item.name}`}
          disabled={item.quantity <= 1}
          onClick={() => setQuantity(item.productId, item.quantity - 1)}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span className="w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
          {item.quantity}
        </span>
        <Button
          variant="outline"
          className="size-12"
          aria-label={`One more ${item.name}`}
          disabled={item.quantity >= item.stockQty}
          onClick={() => setQuantity(item.productId, item.quantity + 1)}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>

      <CurrencyText
        amount={computeLineTotal({ unitPrice: item.unitPrice, quantity: item.quantity })}
        className="w-24 text-right font-semibold"
      />

      <Button
        variant="ghost"
        className="size-12 text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Remove ${item.name}`}
        onClick={() => removeItem(item.productId)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  )
}
