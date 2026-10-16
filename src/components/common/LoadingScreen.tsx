import { Loader2 } from 'lucide-react'

// Full-screen spinner shown while the app checks who is logged in.
export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center gap-3 bg-background text-muted-foreground"
    >
      <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
