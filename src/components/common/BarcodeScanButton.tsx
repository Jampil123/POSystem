import { useEffect, useEffectEvent, useId, useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type BarcodeScanButtonProps = {
  onScan: (code: string) => void
  /** Text for screen readers, e.g. "Scan barcode with camera". */
  label?: string
}

// Camera scan button for tablets and phones (touch screens only; desktop uses a USB scanner).
export function BarcodeScanButton({
  onScan,
  label = 'Scan barcode with camera',
}: BarcodeScanButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="hidden size-12 shrink-0 pointer-coarse:inline-flex"
        aria-label={label}
        title={label}
        onClick={() => setOpen(true)}
      >
        <Camera className="size-5" aria-hidden="true" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl max-md:h-dvh max-md:max-w-full max-md:content-start max-md:rounded-none">
          <DialogHeader>
            <DialogTitle>Scan barcode</DialogTitle>
            <DialogDescription>Point the camera at the barcode.</DialogDescription>
          </DialogHeader>
          {open && (
            <CameraScanner
              onScan={(code) => {
                setOpen(false)
                onScan(code)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function CameraScanner({ onScan }: { onScan: (code: string) => void }) {
  // html5-qrcode needs an element id; useId values contain ":" so they are removed.
  const regionId = `scanner-${useId().replace(/:/g, '')}`
  const [error, setError] = useState<string | null>(null)
  const handleScan = useEffectEvent(onScan)

  useEffect(() => {
    let done = false

    // The scanner library is large, so it is loaded only when the camera is opened.
    const started = import('html5-qrcode').then(
      async ({ Html5Qrcode, Html5QrcodeSupportedFormats: formats }) => {
        const scanner = new Html5Qrcode(regionId, {
          formatsToSupport: [
            formats.EAN_13,
            formats.EAN_8,
            formats.UPC_A,
            formats.UPC_E,
            formats.CODE_128,
            formats.CODE_39,
            formats.QR_CODE,
          ],
          verbose: false,
        })
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 140 } },
          (code) => {
            if (done) return
            done = true
            handleScan(code)
          },
          undefined,
        )
        return scanner
      },
    )

    started.catch(() => {
      setError(
        'Could not open the camera. Allow camera access in the browser, or type the barcode instead.',
      )
    })

    // Stop the camera when the dialog closes.
    return () => {
      done = true
      void started
        .then(async (scanner) => {
          if (scanner.isScanning) await scanner.stop()
          scanner.clear()
        })
        .catch(() => undefined)
    }
  }, [regionId])

  return (
    <div className="flex flex-col gap-3">
      <div id={regionId} className="min-h-48 w-full overflow-hidden rounded-lg bg-muted" />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
