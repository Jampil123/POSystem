import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PackagePlus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { EmptyState } from '@/components/common/EmptyState'
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
import { ProductSearch } from '@/features/inventory/components/ProductSearch'
import { useRecordStockIn } from '@/features/inventory/hooks/useStockChanges'
import {
  stockInSchema,
  todayDateString,
  type StockInFormInput,
  type StockInValues,
} from '@/features/inventory/schema'
import type { ProductListItem } from '@/features/products/api'
import { useProducts } from '@/features/products/hooks/useProducts'
import { errorMessage } from '@/lib/errors'

function emptyStockIn(): StockInFormInput {
  return { supplier_name: '', received_date: todayDateString(), items: [] }
}

// A delivery: supplier (optional), date, and the items received. Saved with record_stock_in.
export function StockInForm() {
  const products = useProducts()
  const recordStockIn = useRecordStockIn()
  const form = useForm<StockInFormInput, unknown, StockInValues>({
    resolver: zodResolver(stockInSchema),
    defaultValues: emptyStockIn(),
  })
  const items = useFieldArray({ control: form.control, name: 'items' })
  const itemsError = form.formState.errors.items

  function addProduct(product: ProductListItem) {
    // Scanning the same product again adds one more instead of a new line.
    const index = form.getValues('items').findIndex((item) => item.product_id === product.id)
    if (index >= 0) {
      const quantity = Number(form.getValues(`items.${index}.quantity`)) || 0
      form.setValue(`items.${index}.quantity`, String(quantity + 1), { shouldValidate: true })
      return
    }
    items.append({
      product_id: product.id,
      product_name: product.name,
      quantity: '1',
      unit_cost: product.cost_price.toFixed(2),
    })
    form.clearErrors('items')
  }

  function handleSubmit(values: StockInValues) {
    recordStockIn.mutate(values, {
      onSuccess: () => {
        toast.success('Stock added')
        form.reset(emptyStockIn())
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  if (products.isPending) return <ListSkeleton rows={4} />
  if (products.isError) {
    return (
      <ErrorState message="Could not load the products." onRetry={() => void products.refetch()} />
    )
  }

  const activeProducts = products.data.filter((product) => product.is_active)

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-5 rounded-lg border bg-card p-4 md:p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="supplier_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier name (optional)</FormLabel>
                <FormControl>
                  <Input className="h-12" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="received_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date received</FormLabel>
                <FormControl>
                  <Input type="date" className="h-12" max={todayDateString()} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ProductSearch label="Add item" products={activeProducts} onSelect={addProduct} />

        <section aria-label="Items received" className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Items</h2>

          {items.fields.length === 0 ? (
            <EmptyState
              icon={PackagePlus}
              message="No items yet. Search or scan a product above."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {items.fields.map((item, index) => (
                <li
                  key={item.id}
                  className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_8rem_9rem_auto] md:items-start"
                >
                  <div className="grid gap-2">
                    <span className="text-sm leading-none text-muted-foreground">Product</span>
                    <span className="font-medium md:flex md:min-h-12 md:items-center">
                      {item.product_name}
                    </span>
                  </div>
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input className="h-12" inputMode="numeric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unit_cost`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit cost (₱)</FormLabel>
                        <FormControl>
                          <Input className="h-12" inputMode="decimal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 md:mt-[22px]"
                    aria-label={`Remove ${item.product_name}`}
                    onClick={() => items.remove(index)}
                  >
                    <Trash2 aria-hidden="true" />
                    <span className="md:sr-only">Remove</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {(itemsError?.message ?? itemsError?.root?.message) && (
            <p role="alert" className="text-sm text-destructive">
              {itemsError?.message ?? itemsError?.root?.message}
            </p>
          )}
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="h-12 w-full md:w-auto md:px-8"
            disabled={recordStockIn.isPending}
          >
            {recordStockIn.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Save stock in
          </Button>
        </div>
      </form>
    </Form>
  )
}
