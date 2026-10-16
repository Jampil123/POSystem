import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { BarcodeScanButton } from '@/components/common/BarcodeScanButton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
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
import { Switch } from '@/components/ui/switch'
import {
  BarcodeTakenError,
  type CategoryListItem,
  type ProductListItem,
} from '@/features/products/api'
import { useSaveProduct } from '@/features/products/hooks/useSaveProduct'
import {
  emptyProductForm,
  isPriceBelowCost,
  productSchema,
  type ProductFormInput,
  type ProductFormValues,
} from '@/features/products/schema'
import { errorMessage } from '@/lib/errors'

type ProductFormProps = {
  /** null when adding a new product. */
  product: ProductListItem | null
  categories: CategoryListItem[]
  onDone: () => void
}

function toFormInput(product: ProductListItem): ProductFormInput {
  return {
    name: product.name,
    category_id: String(product.category_id),
    barcode: product.barcode ?? '',
    cost_price: product.cost_price.toFixed(2),
    selling_price: product.selling_price.toFixed(2),
    low_stock_level: String(product.low_stock_level),
    is_active: product.is_active,
  }
}

export function ProductForm({ product, categories, onDone }: ProductFormProps) {
  const saveProduct = useSaveProduct()
  // Values waiting for the "Deactivate product?" confirmation.
  const [pendingValues, setPendingValues] = useState<ProductFormValues | null>(null)

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? toFormInput(product) : emptyProductForm,
  })
  const [costPrice, sellingPrice] = useWatch({
    control: form.control,
    name: ['cost_price', 'selling_price'],
  })

  function save(values: ProductFormValues) {
    saveProduct.mutate(
      { id: product?.id, values },
      {
        onSuccess: () => {
          toast.success(product ? 'Product saved' : 'Product added')
          setPendingValues(null)
          onDone()
        },
        onError: (error) => {
          setPendingValues(null)
          if (error instanceof BarcodeTakenError) {
            form.setError('barcode', { message: error.message }, { shouldFocus: true })
          } else {
            toast.error(errorMessage(error))
          }
        },
      },
    )
  }

  function handleSubmit(values: ProductFormValues) {
    // Turning off an active product needs a confirmation first.
    if (product?.is_active && !values.is_active) setPendingValues(values)
    else save(values)
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input className="h-12" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full data-[size=default]:h-12">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categories.length === 0 && (
                  <FormDescription>Add a category first with “Manage categories”.</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barcode (optional)</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      className="h-12"
                      autoComplete="off"
                      // A USB scanner types the code and presses Enter; keep Enter from saving the form.
                      onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
                      {...field}
                    />
                  </FormControl>
                  <BarcodeScanButton
                    onScan={(code) =>
                      form.setValue('barcode', code, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                </div>
                <FormDescription>Type it, or scan it with a barcode scanner.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cost_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost price (₱)</FormLabel>
                  <FormControl>
                    <Input className="h-12" inputMode="decimal" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selling_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling price (₱)</FormLabel>
                  <FormControl>
                    <Input className="h-12" inputMode="decimal" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isPriceBelowCost(costPrice, sellingPrice) && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
              Warning: the selling price is lower than the cost price. You can still save.
            </p>
          )}

          <FormField
            control={form.control}
            name="low_stock_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Low-stock level</FormLabel>
                <FormControl>
                  <Input className="h-12" inputMode="numeric" {...field} />
                </FormControl>
                <FormDescription>
                  The product is marked “Low” when its stock reaches this number.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="font-medium">
              Stock on hand: <span className="tabular-nums">{product?.stock_qty ?? 0}</span>
            </p>
            <p className="text-muted-foreground">
              Stock is changed on the Inventory page (stock in or adjustment).
            </p>
          </div>

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex min-h-12 items-center justify-between gap-3 rounded-lg border p-3">
                <div className="grid gap-1">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>Inactive products cannot be sold.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 border-t p-4">
          <Button type="button" variant="outline" className="h-12 flex-1" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" className="h-12 flex-1" disabled={saveProduct.isPending}>
            {saveProduct.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {product ? 'Save changes' : 'Add product'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={pendingValues !== null}
        onOpenChange={(open) => !open && setPendingValues(null)}
        title="Deactivate this product?"
        description="It will no longer be sold. Its past sales and stock history are kept, and you can activate it again later."
        confirmLabel="Deactivate"
        isPending={saveProduct.isPending}
        onConfirm={() => pendingValues && save(pendingValues)}
      />
    </Form>
  )
}
