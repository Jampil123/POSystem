import type { DateRange } from '@/features/reports/utils/dateRanges'

/** e.g. reportFileName('sales-report', { from: '2026-10-01', to: '2026-10-31' }, 'xlsx')
 *  -> "sales-report_2026-10-01_to_2026-10-31.xlsx" */
export function reportFileName(name: string, range: DateRange, extension: 'xlsx' | 'pdf'): string {
  return `${name}_${range.from}_to_${range.to}.${extension}`
}
