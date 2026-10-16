import { Skeleton } from '@/components/ui/skeleton'

// Skeleton rows shown while a table or list is loading.
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" className="flex flex-col gap-2">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full bg-muted" />
      ))}
    </div>
  )
}
