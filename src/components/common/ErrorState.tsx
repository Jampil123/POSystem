import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  message?: string
  onRetry: () => void
}

export function ErrorState({ message = 'Could not load the data.', onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-card px-4 py-10 text-center"
    >
      <CircleAlert className="size-8 text-destructive" aria-hidden="true" />
      <p className="text-destructive">{message} Check the internet connection.</p>
      <Button variant="outline" className="h-12 px-6" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
