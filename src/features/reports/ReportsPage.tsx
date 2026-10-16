import { useState } from 'react'
import { PageHeader } from '@/components/common/PageHeader'
import type { ReportExportData } from '@/features/reports/api'
import { DateRangeFilter } from '@/features/reports/components/DateRangeFilter'
import { ExportButtons } from '@/features/reports/components/ExportButtons'
import {
  BestSellersTable,
  LowStockList,
  ShiftSummaryTable,
} from '@/features/reports/components/ReportTables'
import { SalesChart } from '@/features/reports/components/SalesChart'
import { SummaryCards } from '@/features/reports/components/SummaryCards'
import {
  useBestSellers,
  useDailySales,
  useLowStock,
  useReportSummary,
  useShiftSummary,
} from '@/features/reports/hooks/useReports'
import {
  getPresetRange,
  rangeError,
  type DatePreset,
  type DateRange,
} from '@/features/reports/utils/dateRanges'
import { useStoreSettings } from '@/features/settings/hooks/useStoreSettings'

// Admin only (see navItems). The numbers come from database functions.
export default function ReportsPage() {
  const [preset, setPreset] = useState<DatePreset>('today')
  const [customRange, setCustomRange] = useState<DateRange>(() => getPresetRange('today'))

  const range = preset === 'custom' ? customRange : getPresetRange(preset)
  const error = preset === 'custom' ? rangeError(range) : null
  const ready = error === null

  const summary = useReportSummary(range, ready)
  const daily = useDailySales(range, ready)
  const bestSellers = useBestSellers(range, ready)
  const lowStock = useLowStock()
  const shifts = useShiftSummary(range, ready)
  const settings = useStoreSettings()

  const exportData: ReportExportData | null =
    ready && summary.data && bestSellers.data && lowStock.data && shifts.data
      ? {
          storeName: settings.data?.store_name ?? 'Kuya Tata Store',
          range,
          summary: summary.data,
          bestSellers: bestSellers.data,
          lowStock: lowStock.data,
          shifts: shifts.data,
        }
      : null

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Reports" actions={<ExportButtons data={exportData} />} />

      <DateRangeFilter
        preset={preset}
        customRange={customRange}
        error={error}
        onPresetChange={(next) => {
          // Custom starts from the range that was showing.
          if (next === 'custom') setCustomRange(range)
          setPreset(next)
        }}
        onCustomRangeChange={setCustomRange}
      />

      <p className="text-sm text-muted-foreground">
        {range.from === range.to ? range.from : `${range.from} to ${range.to}`} (Philippine time).
        Voided sales are not counted; refunds are subtracted.
      </p>

      <SummaryCards
        summary={summary.data}
        isPending={summary.isPending}
        isError={summary.isError}
        onRetry={() => void summary.refetch()}
      />

      <SalesChart
        days={daily.data}
        isPending={daily.isPending}
        isError={daily.isError}
        onRetry={() => void daily.refetch()}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <BestSellersTable
          data={bestSellers.data}
          isPending={bestSellers.isPending}
          isError={bestSellers.isError}
          onRetry={() => void bestSellers.refetch()}
        />
        <LowStockList
          data={lowStock.data}
          isPending={lowStock.isPending}
          isError={lowStock.isError}
          onRetry={() => void lowStock.refetch()}
        />
      </div>

      <ShiftSummaryTable
        data={shifts.data}
        isPending={shifts.isPending}
        isError={shifts.isError}
        onRetry={() => void shifts.refetch()}
      />
    </div>
  )
}
