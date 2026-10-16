import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Shown instead of a blank page when something unexpected breaks.
// Reloading keeps the cart (it is saved in this browser tab).
export function CrashScreen() {
  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center"
    >
      <TriangleAlert className="size-12 text-destructive" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        The screen could not be shown. Reload the app to continue; the cart is kept.
      </p>
      <Button className="h-12 px-8" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </div>
  )
}
