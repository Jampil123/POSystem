import type { ReportExportData } from '@/features/reports/api'
import { reportFileName } from '@/features/reports/utils/reportFileName'
import { reportTables } from '@/features/reports/utils/reportRows'

const MARGIN = 14
const BLACK = 0
const WHITE = 255

// Saves the report as a black-and-white PDF with the store name and date range at the top.
// jsPDF is large, so it is loaded only when the button is pressed.
export async function exportPdf(data: ReportExportData): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  doc.setTextColor(BLACK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(data.storeName, MARGIN, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Sales report: ${data.range.from} to ${data.range.to}`, MARGIN, 25)

  let y = 32
  for (const table of reportTables(data)) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(table.title, MARGIN, y + 4)

    autoTable(doc, {
      startY: y + 7,
      margin: { left: MARGIN, right: MARGIN },
      head: [table.head],
      body: table.body.length > 0 ? table.body : [['No data for this date range']],
      theme: 'grid',
      styles: { fontSize: 9, textColor: BLACK, lineColor: BLACK, lineWidth: 0.1 },
      headStyles: { fillColor: WHITE, textColor: BLACK, fontStyle: 'bold' },
      // Remember where the table ended so the next title goes below it.
      didDrawPage: (hook) => {
        y = hook.cursor?.y ?? y
      },
    })

    y += 8
    // Start a new page when there is no room for the next title and a few rows.
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 18
    }
  }

  doc.save(reportFileName('sales-report', data.range, 'pdf'))
}
