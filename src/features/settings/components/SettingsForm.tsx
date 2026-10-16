import type { ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { StoreSettings } from '@/features/settings/api'
import { useSaveStoreSettings } from '@/features/settings/hooks/useStoreSettings'
import { settingsSchema, type SettingsInput, type SettingsValues } from '@/features/settings/schema'
import { cn } from '@/lib/utils'

function toFormInput(settings: StoreSettings): SettingsInput {
  return {
    store_name: settings.store_name,
    address: settings.address,
    contact_no: settings.contact_no,
    vat_enabled: settings.vat_enabled,
    vat_rate: String(settings.vat_rate),
    receipt_footer: settings.receipt_footer,
    receipt_paper_width: settings.receipt_paper_width === 80 ? '80' : '58',
    default_low_stock_level: String(settings.default_low_stock_level),
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-card p-4 md:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

// UI guide 6.9: store name, address, contact number, VAT on/off and rate, receipt footer,
// plus the receipt paper width and the low-stock level for new products.
export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const save = useSaveStoreSettings()
  const form = useForm<SettingsInput, unknown, SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormInput(settings),
  })
  const vatEnabled = useWatch({ control: form.control, name: 'vat_enabled' })

  function handleSubmit(values: SettingsValues) {
    save.mutate(values, {
      onSuccess: (saved) => {
        toast.success('Settings saved')
        form.reset(toFormInput(saved))
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-4 md:max-w-2xl"
      >
        <Section title="Store details">
          <FormField
            control={form.control}
            name="store_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store name</FormLabel>
                <FormControl>
                  <Input className="h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input className="h-12" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contact_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact number</FormLabel>
                <FormControl>
                  <Input className="h-12" inputMode="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section title="VAT">
          <FormField
            control={form.control}
            name="vat_enabled"
            render={({ field }) => (
              <FormItem className="flex min-h-12 items-center justify-between gap-3 rounded-lg border p-3">
                <div className="grid gap-1">
                  <FormLabel>Show VAT on sales and receipts</FormLabel>
                  <FormDescription>Prices already include VAT.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vat_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VAT rate (%)</FormLabel>
                <FormControl>
                  <Input
                    className="h-12 sm:max-w-40"
                    inputMode="decimal"
                    disabled={!vatEnabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="flex items-start gap-2 rounded-lg border bg-accent p-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            VAT changes apply to new sales only. Past sales keep the VAT saved at the time of sale.
          </p>
        </Section>

        <Section title="Receipt">
          <FormField
            control={form.control}
            name="receipt_footer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt footer message</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormDescription>
                  “This is not an official receipt.” is always printed on receipts.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="receipt_paper_width"
            render={({ field }) => (
              <FormItem>
                <span id="paper-width-label" className="text-sm leading-none font-medium">
                  Default paper width
                </span>
                <div
                  role="group"
                  aria-labelledby="paper-width-label"
                  className="grid grid-cols-2 gap-2 sm:max-w-sm"
                >
                  {(['58', '80'] as const).map((width) => (
                    <Button
                      key={width}
                      type="button"
                      variant="outline"
                      aria-pressed={field.value === width}
                      className={cn('h-12', field.value === width && 'border-primary bg-accent')}
                      onClick={() => field.onChange(width)}
                    >
                      {width}mm
                    </Button>
                  ))}
                </div>
                <FormDescription>The width of the receipt printer's paper.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section title="Products">
          <FormField
            control={form.control}
            name="default_low_stock_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default low-stock level</FormLabel>
                <FormControl>
                  <Input className="h-12 sm:max-w-40" inputMode="numeric" {...field} />
                </FormControl>
                <FormDescription>
                  Filled in for new products. Each product can change it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <div className="flex justify-end pb-[env(safe-area-inset-bottom)]">
          <Button type="submit" className="h-12 w-full md:w-auto md:px-8" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Save settings
          </Button>
        </div>
      </form>
    </Form>
  )
}
