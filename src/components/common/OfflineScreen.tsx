import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

// Covers the app while there is no internet, instead of a broken page.
// The page underneath stays as it is (the cart and open forms are kept), and
// this screen goes away by itself when the connection is back.
// Sales cannot be saved offline in this version.
export function OfflineScreen() {
  const isOnline = useOnlineStatus()
  if (isOnline) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      aria-describedby="offline-text"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-background px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center"
    >
      <WifiOff className="size-12 text-muted-foreground" aria-hidden="true" />
      <h1 id="offline-title" className="text-2xl font-semibold">
        No internet connection
      </h1>
      <p id="offline-text" className="max-w-sm text-muted-foreground">
        Check the Wi-Fi or mobile data. The app continues when the connection is back, and the cart
        is kept.
      </p>
      <Button variant="outline" className="h-12 px-6" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  )
}
