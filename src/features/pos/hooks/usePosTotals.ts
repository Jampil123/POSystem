import { useShallow } from 'zustand/react/shallow'
import { cartItemProblem, useCartStore } from '@/features/pos/store/cartStore'
import { computeChange } from '@/features/pos/utils/computeChange'
import { computeTotals } from '@/features/pos/utils/computeTotals'
import { parseAmount } from '@/features/pos/utils/parseAmount'
import { useStoreSettings } from '@/features/settings/hooks/useStoreSettings'

// Totals, VAT, and change for the current cart, using the shared helpers in pos/utils.
export function usePosTotals() {
  const settings = useStoreSettings()
  const { items, discountType, discountValue, cashReceived } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      discountType: state.discountType,
      discountValue: state.discountValue,
      cashReceived: state.cashReceived,
    })),
  )

  const discountText = discountValue.trim()
  const discountNumber = discountText === '' ? 0 : parseAmount(discountText)

  const totals = computeTotals({
    lines: items.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
    discount: discountNumber === null ? null : { type: discountType, value: discountNumber },
    vatEnabled: settings.data?.vat_enabled ?? false,
    vatRate: settings.data?.vat_rate ?? 0,
  })

  const cash = parseAmount(cashReceived)
  const change = computeChange(totals.total, cash)

  const discountError =
    discountNumber === null ? 'Enter a discount like 10 or 10.50.' : totals.discountError
  const hasProblems = items.some((item) => cartItemProblem(item) !== null)

  return {
    totals,
    cash,
    change,
    discountError,
    hasProblems,
    vatRate: settings.data?.vat_rate ?? 0,
    settingsReady: settings.isSuccess,
    canComplete:
      items.length > 0 && change.isEnough && !discountError && !hasProblems && settings.isSuccess,
  }
}
