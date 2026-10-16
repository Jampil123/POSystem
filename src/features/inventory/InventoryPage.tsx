import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdjustmentForm } from '@/features/inventory/components/AdjustmentForm'
import { MovementHistory } from '@/features/inventory/components/MovementHistory'
import { StockInForm } from '@/features/inventory/components/StockInForm'
import { StockTable } from '@/features/inventory/components/StockTable'

const tabs = [
  { value: 'stock', label: 'Stock on hand' },
  { value: 'stock-in', label: 'Stock in' },
  { value: 'adjustments', label: 'Adjustments' },
  { value: 'history', label: 'Movement history' },
] as const

type TabValue = (typeof tabs)[number]['value']

function isTabValue(value: string | null): value is TabValue {
  return tabs.some((tab) => tab.value === value)
}

// Tabs keep their content mounted (forceMount) so a half-filled form is not
// lost when switching tabs. The open tab is kept in the address (?tab=...).
export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : 'stock'

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Inventory" />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}
        className="gap-4"
      >
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList className="h-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="min-h-12 px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="stock" forceMount className="data-[state=inactive]:hidden">
          <StockTable />
        </TabsContent>
        <TabsContent value="stock-in" forceMount className="data-[state=inactive]:hidden">
          <StockInForm />
        </TabsContent>
        <TabsContent value="adjustments" forceMount className="data-[state=inactive]:hidden">
          <AdjustmentForm />
        </TabsContent>
        <TabsContent value="history" forceMount className="data-[state=inactive]:hidden">
          <MovementHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
