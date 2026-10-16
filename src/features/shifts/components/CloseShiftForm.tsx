import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CurrencyText } from '@/components/common/CurrencyText'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { computeCashDifference } from '@/features/pos/utils/computeShiftCash'
import { parseAmount } from '@/features/pos/utils/parseAmount'
import type { Shift } from '@/features/shifts/api'
import { CashDifference } from '@/features/shifts/components/CashDifference'
import { useCloseShift, useShiftCashSummary } from '@/features/shifts/hooks/useShifts'
import {
  closeShiftSchema,
  type CloseShiftInput,
  type CloseShiftValues,
} from '@/features/shifts/schema'
import { formatCurrency } from '@/lib/currency'
import { errorMessage } from '@/lib/errors'

// UI guide 6.7: starting cash, cash sales, refunds, expected cash, and the cash counted.
export function CloseShiftForm({ shift }: { shift: Shift }) {
  const summary = useShiftCashSummary(shift.id)
  const closeShift = useCloseShift()
  // Values waiting for the "Close shift?" confirmation.
  const [pending, setPending] = useState<CloseShiftValues | null>(null)

  const form = useForm<CloseShiftInput, unknown, CloseShiftValues>({
    resolver: zodResolver(closeShiftSchema),
    defaultValues: { actual_cash: '' },
  })
  const actualCashText = useWatch({ control: form.control, name: 'actual_cash' })

  if (summary.isPending) return <ListSkeleton rows={4} />
  if (summary.isError) {
    return (
      <ErrorState
        message="Could not load the shift's cash summary."
        onRetry={() => void summary.refetch()}
      />
    )
  }

  const cash = summary.data
  const actualCash = parseAmount(actualCashText)
  const difference =
    actualCash === null ? null : computeCashDifference(actualCash, cash.expectedCash)

  function confirmClose() {
    if (!pending) return
    closeShift.mutate(
      { shiftId: shift.id, actualCash: pending.actual_cash },
      {
        onSuccess: (closed) => {
          const result = closed.difference ?? 0
          toast.success(
            result === 0
              ? 'Shift closed. The cash is balanced.'
              : `Shift closed. The cash is ${result > 0 ? 'over' : 'short'} by ${formatCurrency(Math.abs(result))}.`,
          )
          setPending(null)
        },
        onError: (error) => {
          toast.error(errorMessage(error))
          setPending(null)
        },
      },
    )
  }

  return (
    <section
      aria-labelledby="close-shift-title"
      className="flex flex-col gap-5 rounded-lg border bg-card p-4 md:p-6"
    >
      <div>
        <h2 id="close-shift-title" className="text-lg font-semibold">
          Close shift
        </h2>
        <p className="text-sm text-muted-foreground">
          Open since {format(new Date(shift.opened_at), 'MM/dd/yyyy h:mm a')}
        </p>
      </div>

      <dl className="grid gap-2 text-sm sm:max-w-md">
        <SummaryRow label="Starting cash" amount={cash.startingCash} />
        <SummaryRow label="Cash sales" amount={cash.cashSales} />
        <SummaryRow label="Refunds (taken out)" amount={cash.refunds} />
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Expected cash</dt>
          <dd>
            <CurrencyText amount={cash.expectedCash} />
          </dd>
        </div>
      </dl>

      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(setPending)}
          className="flex flex-col gap-4 sm:max-w-md"
        >
          <FormField
            control={form.control}
            name="actual_cash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual cash counted (₱)</FormLabel>
                <FormControl>
                  <Input
                    className="h-12 text-lg"
                    inputMode="decimal"
                    placeholder="0.00"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {difference !== null && (
            <p className="flex items-center gap-2 text-sm" role="status">
              Difference: <CashDifference difference={difference} />
            </p>
          )}

          <Button type="submit" variant="destructive" className="h-12">
            Close shift
          </Button>
        </form>
      </Form>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Close this shift?"
        description="Sales stop until a new shift is opened. The expected cash and the difference are saved."
        confirmLabel="Close shift"
        isPending={closeShift.isPending}
        onConfirm={confirmClose}
      />
    </section>
  )
}

function SummaryRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <CurrencyText amount={amount} />
      </dd>
    </div>
  )
}
