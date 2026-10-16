import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { useOpenShift } from '@/features/shifts/hooks/useShifts'
import {
  openShiftSchema,
  type OpenShiftInput,
  type OpenShiftValues,
} from '@/features/shifts/schema'
import { errorMessage } from '@/lib/errors'

// UI guide 6.2: one input for the starting cash and a yellow "Open shift" button.
export function OpenShiftForm() {
  const openShift = useOpenShift()
  const form = useForm<OpenShiftInput, unknown, OpenShiftValues>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: { starting_cash: '' },
  })

  function handleSubmit(values: OpenShiftValues) {
    openShift.mutate(values.starting_cash, {
      onSuccess: () => toast.success('Shift opened'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Open shift</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Count the cash in the drawer before the first sale. Sales can start after the shift is open.
      </p>
      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
          className="mt-5 flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="starting_cash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Starting cash (₱)</FormLabel>
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
          <Button type="submit" className="h-12 text-base" disabled={openShift.isPending}>
            {openShift.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Open shift
          </Button>
        </form>
      </Form>
    </div>
  )
}
