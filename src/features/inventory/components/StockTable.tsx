import { useState } from 'react'
import { PackageCheck, PackageX } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StockStatusBadge } from '@/features/inventory/components/StockStatusBadge'
import { getStockStatus } from '@/features/inventory/utils/stockStatus'
import { useProducts } from '@/features/products/hooks/useProducts'

type StockFilter = 'all' | 'low' | 'out'

const filterOptions: { value: StockFilter; label: string }[] = [
  { value: 'all', label: 'All items' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
]

// Stock on hand of active products, with a filter for low and out-of-stock items.
export function StockTable() {
  const products = useProducts()
  const [filter, setFilter] = useState<StockFilter>('all')

  const activeProducts = (products.data ?? []).filter((product) => product.is_active)
  const visibleProducts = activeProducts.filter(
    (product) =>
      filter === 'all' || getStockStatus(product.stock_qty, product.low_stock_level) === filter,
  )

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Show" className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            aria-pressed={filter === option.value}
            className="h-12 rounded-full aria-pressed:border-primary aria-pressed:bg-accent"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {products.isPending ? (
        <ListSkeleton rows={6} />
      ) : products.isError ? (
        <ErrorState message="Could not load the stock." onRetry={() => void products.refetch()} />
      ) : activeProducts.length === 0 ? (
        <EmptyState
          icon={PackageX}
          message="No active products yet. Add them on the Products page."
        />
      ) : visibleProducts.length === 0 ? (
        <EmptyState
          icon={PackageCheck}
          message={filter === 'out' ? 'No items are out of stock.' : 'No items are low on stock.'}
        />
      ) : (
        <>
          <div className="hidden rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Low-stock level</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="px-4 font-medium whitespace-normal">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{product.stock_qty}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {product.low_stock_level}
                    </TableCell>
                    <TableCell className="px-4">
                      <StockStatusBadge
                        stockQty={product.stock_qty}
                        lowStockLevel={product.low_stock_level}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {visibleProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Low at {product.low_stock_level} · {product.category?.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-semibold tabular-nums">{product.stock_qty}</span>
                  <StockStatusBadge
                    stockQty={product.stock_qty}
                    lowStockLevel={product.low_stock_level}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
