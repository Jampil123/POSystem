import { useEffect, useRef, useState, type RefObject } from 'react'
import { PackageSearch, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { BarcodeScanButton } from '@/components/common/BarcodeScanButton'
import { CurrencyText } from '@/components/common/CurrencyText'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getStockStatus } from '@/features/inventory/utils/stockStatus'
import { useCartStore } from '@/features/pos/store/cartStore'
import type { CategoryListItem, ProductListItem } from '@/features/products/api'
import { cn } from '@/lib/utils'

type ProductPickerProps = {
  products: ProductListItem[]
  categories: CategoryListItem[]
  searchRef: RefObject<HTMLInputElement | null>
  /** Keep the search bar focused (desktop), so a USB scanner works right away. */
  keepSearchFocused: boolean
  onNext: () => void
}

function matchesSearch(product: ProductListItem, search: string) {
  const text = search.trim().toLowerCase()
  return !text || product.name.toLowerCase().includes(text) || product.barcode === text
}

// Step 1: search / scan bar, category chips, and the product cards (a list on phones in portrait).
export function ProductPicker({
  products,
  categories,
  searchRef,
  keepSearchFocused,
  onNext,
}: ProductPickerProps) {
  const { search, categoryId, setSearch, setCategoryId, addItem, itemCount } = useCartStore(
    useShallow((state) => ({
      search: state.search,
      categoryId: state.categoryId,
      setSearch: state.setSearch,
      setCategoryId: state.setCategoryId,
      addItem: state.addItem,
      itemCount: state.items.length,
    })),
  )
  // The product that was just added is briefly highlighted in yellow tint.
  const [flashId, setFlashId] = useState<number | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (keepSearchFocused) searchRef.current?.focus()
    return () => window.clearTimeout(flashTimer.current)
  }, [keepSearchFocused, searchRef])

  const sellable = products.filter((product) => product.is_active)
  const visible = sellable.filter(
    (product) =>
      matchesSearch(product, search) && (categoryId === null || product.category_id === categoryId),
  )

  function add(product: ProductListItem) {
    const result = addItem(product)
    if (result === 'out-of-stock') toast.error(`${product.name} is out of stock.`)
    if (result === 'at-stock-limit') {
      toast.warning(`Only ${product.stock_qty} ${product.name} in stock.`)
    }
    if (result === 'added') {
      setFlashId(product.id)
      window.clearTimeout(flashTimer.current)
      flashTimer.current = window.setTimeout(() => setFlashId(null), 600)
    }
    if (keepSearchFocused) searchRef.current?.focus()
  }

  function addByBarcode(code: string): boolean {
    const product = sellable.find((item) => item.barcode === code.trim())
    if (!product) return false
    add(product)
    setSearch('')
    return true
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="pos-search">Search or scan</Label>
        <div className="flex gap-2">
          <Input
            ref={searchRef}
            id="pos-search"
            type="search"
            className="h-12 text-base"
            placeholder="Product name or barcode (F1)"
            autoComplete="off"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              // A USB scanner types the barcode and presses Enter.
              if (addByBarcode(search)) return
              if (visible.length === 1) {
                add(visible[0])
                setSearch('')
              }
            }}
          />
          <BarcodeScanButton
            onScan={(code) => {
              if (!addByBarcode(code)) toast.error(`No product has the barcode ${code}.`)
            }}
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Categories"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        <CategoryChip
          label="All"
          selected={categoryId === null}
          onClick={() => setCategoryId(null)}
        />
        {categories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name}
            selected={categoryId === category.id}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          message={
            sellable.length === 0 ? 'No products to sell yet.' : 'No products match the search.'
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2 max-md:landscape:grid-cols-3 md:grid-cols-3 2xl:grid-cols-4">
          {visible.map((product) => (
            <li key={product.id}>
              <ProductButton
                product={product}
                flashing={flashId === product.id}
                onAdd={() => add(product)}
              />
            </li>
          ))}
        </ul>
      )}

      <Button className="h-12 text-base" disabled={itemCount === 0} onClick={onNext}>
        Next: Review cart
      </Button>
    </div>
  )
}

function CategoryChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'min-h-12 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        selected ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}

function ProductButton({
  product,
  flashing,
  onAdd,
}: {
  product: ProductListItem
  flashing: boolean
  onAdd: () => void
}) {
  const status = getStockStatus(product.stock_qty, product.low_stock_level)
  const isOut = status === 'out'

  return (
    <button
      type="button"
      disabled={isOut}
      onClick={onAdd}
      data-product-id={product.id}
      className={cn(
        // Phone portrait: one row per product with an add button.
        'flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border bg-card p-3 text-left transition-colors',
        // Tablets, desktops, and phones in landscape: product cards.
        'md:min-h-28 md:flex-col md:items-start max-md:landscape:flex-col max-md:landscape:items-start short:min-h-20!',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        'hover:bg-muted disabled:bg-muted disabled:opacity-60',
        flashing && 'border-primary bg-accent hover:bg-accent',
      )}
    >
      <span className="min-w-0">
        {/* Screen readers hear "Add <name>, stock, price": the spoken name includes the visible text. */}
        <span className="sr-only">Add </span>
        <span className="line-clamp-2 font-medium">{product.name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="tabular-nums">Stock: {product.stock_qty}</span>
          {status === 'low' && <StatusBadge tone="warning">Low</StatusBadge>}
          {isOut && <StatusBadge tone="danger">Out</StatusBadge>}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <CurrencyText amount={product.selling_price} className="font-semibold" />
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-full border md:hidden max-md:landscape:hidden"
        >
          <Plus className="size-5" />
        </span>
      </span>
    </button>
  )
}
