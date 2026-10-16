import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CartList } from '@/features/pos/components/CartList'
import { PaymentPanel } from '@/features/pos/components/PaymentPanel'
import { ProductPicker } from '@/features/pos/components/ProductPicker'
import { ReceiptDialog } from '@/features/pos/components/ReceiptDialog'
import { StepHeader } from '@/features/pos/components/StepHeader'
import { SummaryBar } from '@/features/pos/components/SummaryBar'
import { useCompleteSale } from '@/features/pos/hooks/useCompleteSale'
import { usePosTotals } from '@/features/pos/hooks/usePosTotals'
import { useCartStore, type PosStep } from '@/features/pos/store/cartStore'
import { getStepStatus } from '@/features/pos/utils/posSteps'
import { useCategories } from '@/features/products/hooks/useCategories'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatCurrency } from '@/lib/currency'
import { errorMessage } from '@/lib/errors'

const STEP_TITLES: Record<PosStep, string> = {
  items: 'Add items',
  review: 'Review cart',
  payment: 'Payment',
}
const STEP_NUMBERS: Record<PosStep, number> = { items: 1, review: 2, payment: 3 }

function itemsText(count: number) {
  return `${count} ${count === 1 ? 'item' : 'items'}`
}

// The whole sale on one screen, in three collapsible steps (UI guide 6.3).
// - 1024px and wider: Step 1 on the left; Steps 2 and 3 on the right.
// - Narrower: one column with all three steps, and a summary bar at the bottom.
// All sale data lives in the cart store, so switching layouts on rotation keeps it.
export function PosCheckout() {
  const isWide = useMediaQuery('(min-width: 1024px)')
  const products = useProducts()
  const categories = useCategories()
  const completeSale = useCompleteSale()
  const { totals, cash, change, canComplete } = usePosTotals()
  const { items, openStep, setOpenStep, clearCart, syncProducts } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      openStep: state.openStep,
      setOpenStep: state.setOpenStep,
      clearCart: state.clearCart,
      syncProducts: state.syncProducts,
    })),
  )
  const [receiptSaleId, setReceiptSaleId] = useState<number | null>(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Keep cart prices and stock in line with the latest products.
  useEffect(() => {
    if (products.data) syncProducts(products.data)
  }, [products.data, syncProducts])

  const hasItems = items.length > 0
  const stepState = { openStep, itemCount: totals.itemCount, cashIsEnough: change.isEnough }

  function handleComplete() {
    if (!canComplete || completeSale.isPending || cash === null) return
    completeSale.mutate(
      {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        cashReceived: cash,
        discount: totals.discount,
      },
      {
        onSuccess: (sale) => {
          toast.success(`Sale completed. Receipt ${sale.receipt_no}`)
          setReceiptSaleId(sale.id)
          clearCart()
        },
        onError: (error) => {
          // The cart is kept; the reloaded stock marks the item that ran out.
          toast.error(errorMessage(error))
          setOpenStep('review')
        },
      },
    )
  }

  function focusSearch() {
    if (!isWide) setOpenStep('items')
    // Wait for Step 1 to open before focusing.
    window.setTimeout(() => searchRef.current?.focus(), 0)
  }

  useKeyboardShortcuts({
    F1: focusSearch,
    F2: () => hasItems && setOpenStep('payment'),
    F4: () => hasItems && setConfirmingClear(true),
  })

  // Summary bar action: Review cart -> Payment -> Complete sale.
  const action =
    openStep === 'payment'
      ? { label: 'Complete sale', disabled: !canComplete, run: handleComplete }
      : openStep === 'review' || isWide
        ? { label: 'Payment', disabled: !hasItems, run: () => setOpenStep('payment') }
        : { label: 'Review cart', disabled: !hasItems, run: () => setOpenStep('review') }

  const summaries: Record<PosStep, string> = {
    items: hasItems ? `${itemsText(totals.itemCount)} added` : 'No items yet',
    review: hasItems
      ? `${itemsText(totals.itemCount)} · ${formatCurrency(totals.total)}`
      : 'Cart is empty',
    payment:
      cash === null
        ? 'Not started'
        : change.isEnough
          ? `Cash ${formatCurrency(cash)} · Change ${formatCurrency(change.change)}`
          : `Cash ${formatCurrency(cash)} · Insufficient cash`,
  }

  const stepContent: Record<PosStep, ReactNode> = {
    items: products.isPending ? (
      // Tall enough that the steps below do not jump when the products appear.
      <ListSkeleton rows={12} />
    ) : products.isError ? (
      <ErrorState message="Could not load the products." onRetry={() => void products.refetch()} />
    ) : (
      <ProductPicker
        products={products.data}
        categories={categories.data ?? []}
        searchRef={searchRef}
        keepSearchFocused={isWide}
        onNext={() => setOpenStep('review')}
      />
    ),
    review: (
      <CartList onClear={() => setConfirmingClear(true)} onNext={() => setOpenStep('payment')} />
    ),
    payment: <PaymentPanel onComplete={handleComplete} isSaving={completeSale.isPending} />,
  }

  function stepItem(step: PosStep) {
    return (
      <AccordionItem
        key={step}
        value={step}
        className="rounded-lg border bg-card px-4 last:border-b"
      >
        <AccordionTrigger className="min-h-16 items-center py-3 hover:no-underline">
          <StepHeader
            number={STEP_NUMBERS[step]}
            title={STEP_TITLES[step]}
            summary={summaries[step]}
            status={getStepStatus(step, stepState)}
          />
        </AccordionTrigger>
        <AccordionContent className="pb-4">{stepContent[step]}</AccordionContent>
      </AccordionItem>
    )
  }

  const summaryBar = (
    <SummaryBar
      itemCount={totals.itemCount}
      total={totals.total}
      actionLabel={action.label}
      actionDisabled={action.disabled}
      isSaving={completeSale.isPending}
      onAction={action.run}
      fixed={!isWide}
    />
  )

  return (
    <>
      {isWide ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] items-start gap-4">
          <section aria-label="Step 1, Add items" className="rounded-lg border bg-card p-4">
            <div className="mb-4">
              <StepHeader
                number={1}
                title={STEP_TITLES.items}
                summary={summaries.items}
                status={hasItems ? 'done' : 'active'}
              />
            </div>
            {stepContent.items}
          </section>

          <div className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-3">
            <Accordion
              type="single"
              collapsible
              // While adding items, the cart stays open next to the products.
              value={openStep === 'items' ? 'review' : (openStep ?? '')}
              onValueChange={(value) => setOpenStep(value === '' ? null : (value as PosStep))}
              className="flex min-h-0 flex-col gap-3 overflow-y-auto"
            >
              {stepItem('review')}
              {stepItem('payment')}
            </Accordion>
            {summaryBar}
          </div>
        </div>
      ) : (
        // Bottom padding keeps the last step above the fixed summary bar.
        <div className="pb-24">
          <Accordion
            type="single"
            collapsible
            value={openStep ?? ''}
            onValueChange={(value) => setOpenStep(value === '' ? null : (value as PosStep))}
            className="flex flex-col gap-3"
          >
            {stepItem('items')}
            {stepItem('review')}
            {stepItem('payment')}
          </Accordion>
          {summaryBar}
        </div>
      )}

      <ConfirmDialog
        open={confirmingClear}
        onOpenChange={setConfirmingClear}
        title="Clear the cart?"
        description="All items, the discount, and the cash entered will be removed."
        confirmLabel="Clear cart"
        onConfirm={() => {
          clearCart()
          setConfirmingClear(false)
          toast.success('Cart cleared')
          if (isWide) searchRef.current?.focus()
        }}
      />

      <ReceiptDialog
        saleId={receiptSaleId}
        onClose={() => {
          setReceiptSaleId(null)
          if (isWide) window.setTimeout(() => searchRef.current?.focus(), 0)
        }}
      />
    </>
  )
}
