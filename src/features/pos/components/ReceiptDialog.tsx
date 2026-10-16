import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useReceiptSale } from '@/features/pos/hooks/useReceiptSale'
import { useStoreSettings } from '@/features/settings/hooks/useStoreSettings'
import ReceiptView, { type PaperWidth } from '@/receipt/ReceiptView'
import { cn } from '@/lib/utils'

const PAPER_WIDTH_KEY = 'kuya-tata-receipt-width'

// The printer's paper width is remembered on this device (a convenience only).
function savedPaperWidth(): PaperWidth {
  try {
    return localStorage.getItem(PAPER_WIDTH_KEY) === '80' ? 80 : 58
  } catch {
    return 58
  }
}

type ReceiptDialogProps = {
  /** The sale to show; null closes the dialog. */
  saleId: number | null
  onClose: () => void
}

export function ReceiptDialog({ saleId, onClose }: ReceiptDialogProps) {
  const sale = useReceiptSale(saleId)
  const settings = useStoreSettings()
  const [paperWidth, setPaperWidth] = useState<PaperWidth>(savedPaperWidth)

  function choosePaperWidth(width: PaperWidth) {
    setPaperWidth(width)
    try {
      localStorage.setItem(PAPER_WIDTH_KEY, String(width))
    } catch {
      // Not saved; the choice still works until the page is closed.
    }
  }

  const ready = sale.data && settings.data

  return (
    <Dialog open={saleId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90dvh] flex-col rounded-xl max-md:h-dvh max-md:max-h-dvh max-md:max-w-full max-md:rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Print it with the receipt printer, or start the next sale.
          </DialogDescription>
        </DialogHeader>

        <div role="group" aria-label="Paper width" className="flex gap-2">
          {([58, 80] as const).map((width) => (
            <Button
              key={width}
              variant="outline"
              aria-pressed={paperWidth === width}
              className={cn('h-12 flex-1', paperWidth === width && 'border-primary bg-accent')}
              onClick={() => choosePaperWidth(width)}
            >
              {width}mm paper
            </Button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted p-3">
          {sale.isPending || settings.isPending ? (
            <ListSkeleton rows={6} />
          ) : sale.isError || settings.isError ? (
            <ErrorState
              message="Could not load the receipt."
              onRetry={() => {
                void sale.refetch()
                void settings.refetch()
              }}
            />
          ) : (
            ready && (
              <div className="mx-auto w-fit shadow-sm">
                <ReceiptView sale={sale.data} settings={settings.data} paperWidth={paperWidth} />
              </div>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="h-12" onClick={onClose}>
            Next customer
          </Button>
          <Button className="h-12" disabled={!ready} onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Print receipt
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Copy of the receipt that only shows when printing (see receipt.css). */}
      {saleId !== null &&
        ready &&
        createPortal(
          <div className="receipt-print-root">
            <style>{`@page { size: ${paperWidth}mm auto; margin: 0; }`}</style>
            <ReceiptView sale={sale.data} settings={settings.data} paperWidth={paperWidth} />
          </div>,
          document.body,
        )}
    </Dialog>
  )
}
