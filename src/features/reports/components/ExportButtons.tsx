import { useState } from 'react'
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { ReportExportData } from '@/features/reports/api'
import { exportExcel } from '@/features/reports/utils/exportExcel'
import { exportPdf } from '@/features/reports/utils/exportPdf'

type ExportButtonsProps = {
  /** null until every part of the report has loaded. */
  data: ReportExportData | null
}

// "Export to Excel" and "Export to PDF" (outline buttons, UI guide 6.8).
export function ExportButtons({ data }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  async function run(kind: 'excel' | 'pdf') {
    if (!data) return
    setExporting(kind)
    try {
      await (kind === 'excel' ? exportExcel(data) : exportPdf(data))
      toast.success(kind === 'excel' ? 'Excel file saved' : 'PDF saved')
    } catch {
      toast.error('Could not create the file. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        className="h-12"
        disabled={!data || exporting !== null}
        onClick={() => void run('excel')}
      >
        {exporting === 'excel' ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <FileSpreadsheet aria-hidden="true" />
        )}
        Export to Excel
      </Button>
      <Button
        variant="outline"
        className="h-12"
        disabled={!data || exporting !== null}
        onClick={() => void run('pdf')}
      >
        {exporting === 'pdf' ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <FileText aria-hidden="true" />
        )}
        Export to PDF
      </Button>
    </div>
  )
}
