import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// Shown for links that do not match any page.
export function NotFoundScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <MapPinOff className="size-12 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        This link does not lead to a page in the app.
      </p>
      <Button asChild className="h-12 px-8">
        <Link to="/pos">Go to POS</Link>
      </Button>
    </div>
  )
}
