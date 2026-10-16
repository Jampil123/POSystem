import { Pencil, Power, PowerOff } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { StatusBadge } from '@/components/common/StatusBadge'
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
import type { ProductListItem } from '@/features/products/api'
import { cn } from '@/lib/utils'

type ProductTableProps = {
  products: ProductListItem[]
  onEdit: (product: ProductListItem) => void
  onToggleActive: (product: ProductListItem) => void
}

// Table on tablets and desktops; one card per product on phones.
export function ProductTable({ products, onEdit, onToggleActive }: ProductTableProps) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden lg:table-cell">Barcode</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                className={cn(!product.is_active && 'text-muted-foreground')}
              >
                <TableCell className="px-4 font-medium whitespace-normal">{product.name}</TableCell>
                <TableCell>{product.category?.name}</TableCell>
                <TableCell className="hidden lg:table-cell">{product.barcode ?? '—'}</TableCell>
                <TableCell className="hidden text-right lg:table-cell">
                  <CurrencyText amount={product.cost_price} />
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyText amount={product.selling_price} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="tabular-nums">{product.stock_qty}</span>
                    <StockStatusBadge
                      stockQty={product.stock_qty}
                      lowStockLevel={product.low_stock_level}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <ActiveBadge isActive={product.is_active} />
                </TableCell>
                <TableCell className="px-4">
                  <ProductActions
                    product={product}
                    onEdit={onEdit}
                    onToggleActive={onToggleActive}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {products.map((product) => (
          <li
            key={product.id}
            className={cn(
              'flex flex-col gap-3 rounded-lg border bg-card p-4',
              !product.is_active && 'text-muted-foreground',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.category?.name}</p>
              </div>
              <CurrencyText amount={product.selling_price} className="font-semibold" />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="tabular-nums">Stock: {product.stock_qty}</span>
              <StockStatusBadge
                stockQty={product.stock_qty}
                lowStockLevel={product.low_stock_level}
              />
              <ActiveBadge isActive={product.is_active} />
            </div>
            <ProductActions product={product} onEdit={onEdit} onToggleActive={onToggleActive} />
          </li>
        ))}
      </ul>
    </>
  )
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <StatusBadge tone="success">Active</StatusBadge>
  ) : (
    <StatusBadge tone="neutral">Inactive</StatusBadge>
  )
}

function ProductActions({
  product,
  onEdit,
  onToggleActive,
}: {
  product: ProductListItem
  onEdit: (product: ProductListItem) => void
  onToggleActive: (product: ProductListItem) => void
}) {
  return (
    <div className="flex gap-2 md:justify-end">
      <Button
        variant="outline"
        className="h-12 flex-1 md:flex-none"
        onClick={() => onEdit(product)}
        aria-label={`Edit ${product.name}`}
      >
        <Pencil aria-hidden="true" />
        Edit
      </Button>
      {product.is_active ? (
        <Button
          variant="outline"
          className="h-12 flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive md:flex-none"
          onClick={() => onToggleActive(product)}
          aria-label={`Deactivate ${product.name}`}
        >
          <PowerOff aria-hidden="true" />
          Deactivate
        </Button>
      ) : (
        <Button
          variant="outline"
          className="h-12 flex-1 md:flex-none"
          onClick={() => onToggleActive(product)}
          aria-label={`Activate ${product.name}`}
        >
          <Power aria-hidden="true" />
          Activate
        </Button>
      )}
    </div>
  )
}
