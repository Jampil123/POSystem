import type { ReportExportData } from '@/features/reports/api'
import { reportFileName } from '@/features/reports/utils/reportFileName'
import { reportTables } from '@/features/reports/utils/reportRows'

// Saves the report as an Excel file with one sheet per table.
// SheetJS is large, so it is loaded only when the button is pressed.
export async function exportExcel(data: ReportExportData): Promise<void> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()

  for (const table of reportTables(data)) {
    const rows = [
      [data.storeName],
      [`${table.title}: ${data.range.from} to ${data.range.to}`],
      [],
      table.head,
      ...(table.body.length > 0 ? table.body : [['No data for this date range']]),
    ]
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    sheet['!cols'] = table.head.map((_, index) => ({ wch: index === 0 ? 32 : 18 }))
    XLSX.utils.book_append_sheet(workbook, sheet, table.title)
  }

  XLSX.writeFile(workbook, reportFileName('sales-report', data.range, 'xlsx'))
}
