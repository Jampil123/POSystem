import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ApprovalRejectedError } from '@/features/transactions/api'
import { useReverseSale } from '@/features/transactions/hooks/useTransactions'
import { voidRefundSchema, type VoidRefundValues } from '@/features/transactions/schema'
import { formatCurrency } from '@/lib/currency'
import { errorMessage } from '@/lib/errors'

type VoidRefundDialogProps = {
  type: 'void' | 'refund' | null
  sale: { id: number; receipt_no: string; total: number }
  onClose: () => void
}

const texts = {
  void: {
    title: 'Void sale',
    action: 'Void sale',
    done: 'Sale voided',
    explain: 'Cancels the whole sale and returns the items to stock.',
  },
  refund: {
    title: 'Refund sale',
    action: 'Refund sale',
    done: 'Sale refunded',
    explain:
      'Returns the whole sale. The items go back to stock and the cash is taken from your open shift.',
  },
}

const emptyValues: VoidRefundValues = { reason: '', admin_username: '', admin_pin: '' }

// Step 1: reason and the admin's username and PIN. Step 2: confirm.
// The PIN is checked in the database (void_sale / refund_sale).
export function VoidRefundDialog({ type, sale, onClose }: VoidRefundDialogProps) {
  const reverseSale = useReverseSale()
  const [confirming, setConfirming] = useState<VoidRefundValues | null>(null)
  const form = useForm<VoidRefundValues>({
    resolver: zodResolver(voidRefundSchema),
    defaultValues: emptyValues,
  })

  function close() {
    if (reverseSale.isPending) return
    setConfirming(null)
    form.reset(emptyValues)
    onClose()
  }

  function save() {
    if (!type || !confirming) return
    reverseSale.mutate(
      { type, saleId: sale.id, values: confirming },
      {
        onSuccess: () => {
          toast.success(`${texts[type].done}. Receipt ${sale.receipt_no}`)
          close()
        },
        onError: (error) => {
          setConfirming(null)
          if (error instanceof ApprovalRejectedError) {
            // Back to the form, with the message under the PIN.
            form.setValue('admin_pin', '')
            form.setError('admin_pin', { message: error.message }, { shouldFocus: true })
          } else {
            toast.error(errorMessage(error))
          }
        },
      },
    )
  }

  const text = type ? texts[type] : texts.void

  return (
    <Dialog open={type !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="rounded-xl max-md:h-dvh max-md:max-w-full max-md:content-start max-md:overflow-y-auto max-md:rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {text.title} · Receipt {sale.receipt_no}
          </DialogTitle>
          <DialogDescription>
            {text.explain} An admin must approve it with their PIN.
          </DialogDescription>
        </DialogHeader>

        {confirming ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p className="font-semibold">
                {text.action} for {formatCurrency(sale.total)}?
              </p>
              <p className="mt-1">Reason: {confirming.reason}</p>
              <p>Approved by: {confirming.admin_username}</p>
              <p className="mt-2">This cannot be undone.</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="h-12"
                disabled={reverseSale.isPending}
                onClick={() => setConfirming(null)}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                className="h-12"
                disabled={reverseSale.isPending}
                onClick={save}
                autoFocus
              >
                {reverseSale.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                {text.action}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              noValidate
              onSubmit={form.handleSubmit(setConfirming)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admin_username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin username</FormLabel>
                    <FormControl>
                      <Input
                        className="h-12"
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck={false}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admin_pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={6}
                        className="h-12 text-lg tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" className="h-12" onClick={close}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-12 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Continue
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
