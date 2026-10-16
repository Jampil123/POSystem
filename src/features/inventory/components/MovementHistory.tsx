import { useState } from 'react'
import { format } from 'date-fns'
import { History, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MovementFilters, MovementListItem } from '@/features/inventory/api'
import { useStockMovements } from '@/features/inventory/hooks/useStockMovements'
import {
  formatQuantityChange,
  movementTypeLabels,
  type MovementType,
} from '@/features/inventory/utils/movementLabels'
import { useProducts } from '@/features/products/hooks/useProducts'

const PAGE_SIZE = 50
const ALL = 'all'

const emptyFilters: MovementFilters = { from: '', to: '', productId: null, type: null }

function formatDateTime(isoDate: string) {
  return format(new Date(isoDate), 'MM/dd/yyyy h:mm a')
}

// Every stock change, newest first, with filters for date range, product, and type.
export function MovementHistory() {
  const products = useProducts()
  const [filters, setFilters] = useState<MovementFilters>(emptyFilters)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const movements = useStockMovements(filters, limit)

  function updateFilters(changes: Partial<MovementFilters>) {
    setFilters((current) => ({ ...current, ...changes }))
    setLimit(PAGE_SIZE)
  }

  const datesReversed = filters.from !== '' && filters.to !== '' && filters.from > filters.to
  const hasFilters =
    filters.from !== '' || filters.to !== '' || filters.productId !== null || filters.type !== null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_1fr_auto] lg:items-end">
        <div className="grid gap-2">
          <Label htmlFor="movement-from">From</Label>
          <Input
            id="movement-from"
            type="date"
            className="h-12"
            value={filters.from}
            onChange={(event) => updateFilters({ from: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="movement-to">To</Label>
          <Input
            id="movement-to"
            type="date"
            className="h-12"
            value={filters.to}
            onChange={(event) => updateFilters({ to: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="movement-product">Product</Label>
          <Select
            value={filters.productId === null ? ALL : String(filters.productId)}
            onValueChange={(value) =>
              updateFilters({ productId: value === ALL ? null : Number(value) })
            }
          >
            <SelectTrigger id="movement-product" className="w-full data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All products</SelectItem>
              {(products.data ?? []).map((product) => (
                <SelectItem key={product.id} value={String(product.id)}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="movement-type">Type</Label>
          <Select
            value={filters.type ?? ALL}
            onValueChange={(value) =>
              updateFilters({ type: value === ALL ? null : (value as MovementType) })
            }
          >
            <SelectTrigger id="movement-type" className="w-full data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All types</SelectItem>
              {Object.entries(movementTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="h-12"
          disabled={!hasFilters}
          onClick={() => updateFilters(emptyFilters)}
        >
          Clear filters
        </Button>
        {datesReversed && (
          <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-5">
            The “From” date is after the “To” date.
          </p>
        )}
      </div>

      {movements.isPending ? (
        <ListSkeleton rows={6} />
      ) : movements.isError ? (
        <ErrorState
          message="Could not load the stock history."
          onRetry={() => void movements.refetch()}
        />
      ) : movements.data.movements.length === 0 ? (
        <EmptyState
          icon={History}
          message={hasFilters ? 'No stock changes match the filters.' : 'No stock changes yet.'}
        />
      ) : (
        <>
          <MovementTable movements={movements.data.movements} />
          {movements.data.hasMore && (
            <Button
              variant="outline"
              className="h-12 self-center px-8"
              disabled={movements.isFetching}
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
            >
              {movements.isFetching && <Loader2 className="animate-spin" aria-hidden="true" />}
              Show more
            </Button>
          )}
        </>
      )}
    </div>
  )
}

function MovementTable({ movements }: { movements: MovementListItem[] }) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Date and time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="px-4">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="px-4 tabular-nums">
                  {formatDateTime(movement.created_at)}
                </TableCell>
                <TableCell>{movementTypeLabels[movement.type]}</TableCell>
                <TableCell className="whitespace-normal">{movement.product?.name}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatQuantityChange(movement.quantity_change)}
                </TableCell>
                <TableCell>{movement.user?.full_name ?? 'System'}</TableCell>
                <TableCell className="px-4 whitespace-normal">{movement.referenceLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {movements.map((movement) => (
          <li key={movement.id} className="flex flex-col gap-1 rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{movement.product?.name}</p>
              <span className="text-lg font-semibold tabular-nums">
                {formatQuantityChange(movement.quantity_change)}
              </span>
            </div>
            <p className="text-sm">
              {movementTypeLabels[movement.type]} · {movement.referenceLabel}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatDateTime(movement.created_at)} · {movement.user?.full_name ?? 'System'}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
