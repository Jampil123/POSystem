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
  emptyTransactionFilters,
  type SaleStatus,
  type TransactionFilters as Filters,
} from '@/features/transactions/api'
import { useCashiers } from '@/features/transactions/hooks/useTransactions'
import { saleStatusLabels } from '@/features/transactions/utils/saleStatus'

const ALL = 'all'

type TransactionFiltersProps = {
  filters: Filters
  onChange: (changes: Partial<Filters>) => void
  /** Only admins can filter by cashier (cashiers only see their own sales). */
  showCashierFilter: boolean
}

// Date range (Philippine time), cashier, status, and receipt number search.
export function TransactionFilters({
  filters,
  onChange,
  showCashierFilter,
}: TransactionFiltersProps) {
  const cashiers = useCashiers(showCashierFilter)
  const hasFilters =
    filters.from !== '' ||
    filters.to !== '' ||
    filters.cashierId !== null ||
    filters.status !== null ||
    filters.receipt !== ''
  const datesReversed = filters.from !== '' && filters.to !== '' && filters.from > filters.to

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr_auto] xl:items-end">
      <div className="grid gap-2">
        <Label htmlFor="transaction-receipt">Receipt number</Label>
        <Input
          id="transaction-receipt"
          type="search"
          inputMode="numeric"
          className="h-12"
          placeholder="e.g. 000123"
          autoComplete="off"
          value={filters.receipt}
          onChange={(event) => onChange({ receipt: event.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="transaction-from">From</Label>
        <Input
          id="transaction-from"
          type="date"
          className="h-12"
          value={filters.from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="transaction-to">To</Label>
        <Input
          id="transaction-to"
          type="date"
          className="h-12"
          value={filters.to}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </div>
      {showCashierFilter && (
        <div className="grid gap-2">
          <Label htmlFor="transaction-cashier">Cashier</Label>
          <Select
            value={filters.cashierId ?? ALL}
            onValueChange={(value) => onChange({ cashierId: value === ALL ? null : value })}
          >
            <SelectTrigger id="transaction-cashier" className="w-full data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All cashiers</SelectItem>
              {(cashiers.data ?? []).map((cashier) => (
                <SelectItem key={cashier.id} value={cashier.id}>
                  {cashier.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="transaction-status">Status</Label>
        <Select
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            onChange({ status: value === ALL ? null : (value as SaleStatus) })
          }
        >
          <SelectTrigger id="transaction-status" className="w-full data-[size=default]:h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.entries(saleStatusLabels).map(([value, label]) => (
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
        onClick={() => onChange(emptyTransactionFilters)}
      >
        Clear filters
      </Button>
      {datesReversed && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2 xl:col-span-6">
          The “From” date is after the “To” date.
        </p>
      )}
    </div>
  )
}
