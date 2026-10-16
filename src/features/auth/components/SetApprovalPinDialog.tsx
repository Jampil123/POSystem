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
import { useSetApprovalPin } from '@/features/auth/hooks/useSetApprovalPin'
import { approvalPinSchema, type ApprovalPinValues } from '@/features/auth/schema'
import { errorMessage } from '@/lib/errors'

type SetApprovalPinDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Admin only: the PIN typed at the counter to approve a void or refund.
export function SetApprovalPinDialog({ open, onOpenChange }: SetApprovalPinDialogProps) {
  const setPin = useSetApprovalPin()
  const form = useForm<ApprovalPinValues>({
    resolver: zodResolver(approvalPinSchema),
    defaultValues: { pin: '', confirm_pin: '' },
  })

  function close(next: boolean) {
    if (!next) form.reset()
    onOpenChange(next)
  }

  function handleSubmit(values: ApprovalPinValues) {
    setPin.mutate(values.pin, {
      onSuccess: () => {
        toast.success('Approval PIN saved')
        close(false)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-xl max-md:h-dvh max-md:max-w-full max-md:content-start max-md:rounded-none sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set approval PIN</DialogTitle>
          <DialogDescription>
            Type this PIN with your username to approve voids and refunds at the counter. Use 4 to 6
            digits and keep it private.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New PIN</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
                      maxLength={6}
                      className="h-12 text-lg tracking-widest"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type the PIN again</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      inputMode="numeric"
                      autoComplete="new-password"
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
              <Button type="button" variant="outline" className="h-12" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-12" disabled={setPin.isPending}>
                {setPin.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Save PIN
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
