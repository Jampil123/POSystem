import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

// Shown when a new version of the app has been deployed.
// The new version loads only when the user taps Reload, so a sale is never interrupted.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[calc(4.5rem+env(safe-area-inset-top))] z-[60] mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-md"
    >
      <p className="font-medium">Update available</p>
      <div className="flex gap-2">
        <Button variant="outline" className="h-12" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button className="h-12" onClick={() => void updateServiceWorker(true)}>
          <RefreshCw aria-hidden="true" />
          Reload
        </Button>
      </div>
    </div>
  )
}
