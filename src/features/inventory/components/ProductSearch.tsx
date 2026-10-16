import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BarcodeScanButton } from '@/components/common/BarcodeScanButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductListItem } from '@/features/products/api'

const MAX_RESULTS = 6

type ProductSearchProps = {
  label: string
  products: ProductListItem[]
  onSelect: (product: ProductListItem) => void
}

function findMatches(products: ProductListItem[], search: string): ProductListItem[] {
  const text = search.trim().toLowerCase()
  if (!text) return []
  return products
    .filter(
      (product) => product.name.toLowerCase().includes(text) || product.barcode?.includes(text),
    )
    .slice(0, MAX_RESULTS)
}

// Search by name, or scan a barcode (USB scanner types it and presses Enter).
export function ProductSearch({ label, products, onSelect }: ProductSearchProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const matches = findMatches(products, search)

  function select(product: ProductListItem) {
    onSelect(product)
    setSearch('')
    // Ready for the next item or scan.
    inputRef.current?.focus()
  }

  function selectByBarcode(code: string): boolean {
    const product = products.find((item) => item.barcode === code.trim())
    if (product) select(product)
    return product !== undefined
  }

  function handleEnter() {
    if (selectByBarcode(search)) return
    if (matches.length === 1) select(matches[0])
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={inputId}
          type="search"
          className="h-12"
          placeholder="Product name or barcode"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            // Enter comes from the scanner or the keyboard; never submit the form.
            event.preventDefault()
            handleEnter()
          }}
        />
        <BarcodeScanButton
          onScan={(code) => {
            if (!selectByBarcode(code)) toast.error(`No product has the barcode ${code}.`)
          }}
        />
      </div>

      {search.trim() !== '' && (
        <ul
          aria-label="Matching products"
          className="flex flex-col divide-y rounded-lg border bg-card"
        >
          {matches.length === 0 ? (
            <li className="p-3 text-sm text-muted-foreground">No matching products.</li>
          ) : (
            matches.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => select(product)}
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{product.name}</span>
                    {product.barcode && (
                      <span className="block text-xs text-muted-foreground">{product.barcode}</span>
                    )}
                  </span>
                  <span className="text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                    Stock: {product.stock_qty}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
