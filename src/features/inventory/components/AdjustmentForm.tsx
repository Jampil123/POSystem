import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Minus, Plus } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ProductSearch } from '@/features/inventory/components/ProductSearch'
import { useAdjustStock } from '@/features/inventory/hooks/useStockChanges'
import {
  ADJUSTMENT_REASONS,
  adjustmentSchema,
  type AdjustmentFormInput,
  type AdjustmentValues,
} from '@/features/inventory/schema'
import { useProducts } from '@/features/products/hooks/useProducts'
import { errorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

const emptyAdjustment: Partial<AdjustmentFormInput> = {
  current_stock: 0,
  direction: 'remove',
  quantity: '',
  notes: '',
}

// Add or remove stock with a required reason. Saved with adjust_stock.
export function AdjustmentForm() {
  const products = useProducts()
  const adjustStock = useAdjustStock()
  const form = useForm<AdjustmentFormInput, unknown, AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: emptyAdjustment,
  })
  const [productId, direction, quantity] = useWatch({
    control: form.control,
    name: ['product_id', 'direction', 'quantity'],
  })

  if (products.isPending) return <ListSkeleton rows={4} />
  if (products.isError) {
    return (
      <ErrorState message="Could not load the products." onRetry={() => void products.refetch()} />
    )
  }

  const activeProducts = products.data.filter((product) => product.is_active)
  const selected = products.data.find((product) => product.id === productId)

  // Preview of the new stock, shown only when the quantity is a valid whole number.
  const amount = /^\d+$/.test(quantity ?? '') ? Number(quantity) : null
  const stockAfter =
    selected && amount !== null
      ? selected.stock_qty + (direction === 'remove' ? -amount : amount)
      : null

  function handleSubmit(values: AdjustmentValues) {
    adjustStock.mutate(values, {
      onSuccess: () => {
        toast.success('Stock adjusted')
        form.reset(emptyAdjustment)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          // Check against the latest stock, in case it changed after the product was chosen.
          if (selected) form.setValue('current_stock', selected.stock_qty)
          void form.handleSubmit(handleSubmit)(event)
        }}
        className="flex flex-col gap-5 rounded-lg border bg-card p-4 md:max-w-2xl md:p-6"
      >
        {selected ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-accent p-3">
            <div>
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm tabular-nums">Current stock: {selected.stock_qty}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-12 bg-card"
              onClick={() => form.reset(emptyAdjustment)}
            >
              Change product
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <ProductSearch
              label="Product"
              products={activeProducts}
              onSelect={(product) => {
                form.setValue('product_id', product.id, { shouldValidate: true })
                form.setValue('current_stock', product.stock_qty)
              }}
            />
            {form.formState.errors.product_id && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.product_id.message}
              </p>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="direction"
          render={({ field }) => (
            <FormItem>
              <span id="adjustment-direction" className="text-sm leading-none font-medium">
                Change
              </span>
              <div
                role="group"
                aria-labelledby="adjustment-direction"
                className="grid grid-cols-2 gap-2"
              >
                {(['remove', 'add'] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    aria-pressed={field.value === value}
                    className={cn('h-12', field.value === value && 'border-primary bg-accent')}
                    onClick={() => field.onChange(value)}
                  >
                    {value === 'remove' ? (
                      <Minus aria-hidden="true" />
                    ) : (
                      <Plus aria-hidden="true" />
                    )}
                    {value === 'remove' ? 'Remove stock' : 'Add stock'}
                  </Button>
                ))}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input className="h-12" inputMode="numeric" {...field} />
              </FormControl>
              {stockAfter !== null && stockAfter >= 0 && (
                <FormDescription className="tabular-nums">
                  Stock after: {stockAfter}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full data-[size=default]:h-12">
                    <SelectValue placeholder="Choose a reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details (needed for “Other”)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="h-12 md:self-end md:px-8" disabled={adjustStock.isPending}>
          {adjustStock.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Save adjustment
        </Button>
      </form>
    </Form>
  )
}
