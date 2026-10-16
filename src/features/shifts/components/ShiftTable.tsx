import { format } from 'date-fns'
import { Clock } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRole } from '@/features/auth/hooks/useRole'
import type { ShiftListItem } from '@/features/shifts/api'
import { CashDifference } from '@/features/shifts/components/CashDifference'
import { useShiftList } from '@/features/shifts/hooks/useShifts'

function formatDateTime(isoDate: string | null) {
  return isoDate ? format(new Date(isoDate), 'MM/dd/yyyy h:mm a') : '—'
}

function Amount({ amount }: { amount: number | null }) {
  return amount === null ? <span>—</span> : <CurrencyText amount={amount} />
}

function ShiftResult({ shift }: { shift: ShiftListItem }) {
  if (shift.closed_at === null || shift.difference === null) {
    return <StatusBadge tone="warning">Open</StatusBadge>
  }
  return <CashDifference difference={shift.difference} />
}

// Past and current shifts. Cashiers only receive their own (security rules).
export function ShiftTable() {
  const shifts = useShiftList()
  const { isAdmin } = useRole()

  if (shifts.isPending) return <ListSkeleton rows={5} />
  if (shifts.isError) {
    return <ErrorState message="Could not load the shifts." onRetry={() => void shifts.refetch()} />
  }
  if (shifts.data.length === 0) return <EmptyState icon={Clock} message="No shifts yet." />

  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Opened</TableHead>
              <TableHead>Closed</TableHead>
              {isAdmin && <TableHead>Cashier</TableHead>}
              <TableHead className="text-right">Starting</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="px-4">Difference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.data.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell className="px-4 tabular-nums">
                  {formatDateTime(shift.opened_at)}
                </TableCell>
                <TableCell className="tabular-nums">{formatDateTime(shift.closed_at)}</TableCell>
                {isAdmin && <TableCell>{shift.cashier?.full_name}</TableCell>}
                <TableCell className="text-right">
                  <Amount amount={shift.starting_cash} />
                </TableCell>
                <TableCell className="text-right">
                  <Amount amount={shift.expected_cash} />
                </TableCell>
                <TableCell className="text-right">
                  <Amount amount={shift.actual_cash} />
                </TableCell>
                <TableCell className="px-4">
                  <ShiftResult shift={shift} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {shifts.data.map((shift) => (
          <li key={shift.id} className="flex flex-col gap-2 rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium tabular-nums">{formatDateTime(shift.opened_at)}</p>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground">{shift.cashier?.full_name}</p>
                )}
              </div>
              <ShiftResult shift={shift} />
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Starting</dt>
                <dd>
                  <Amount amount={shift.starting_cash} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expected</dt>
                <dd>
                  <Amount amount={shift.expected_cash} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Actual</dt>
                <dd>
                  <Amount amount={shift.actual_cash} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
