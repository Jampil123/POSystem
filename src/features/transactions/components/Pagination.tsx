import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginationProps = {
  /** Starts at 0. */
  page: number
  pageSize: number
  total: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, isLoading, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : page * pageSize + 1
  const last = Math.min(total, (page + 1) * pageSize)

  return (
    <nav
      aria-label="Pages"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
    >
      <p className="tabular-nums" aria-live="polite">
        {isLoading && <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden="true" />}
        Showing {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-12"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="tabular-nums">
          Page {page + 1} of {pageCount}
        </span>
        <Button
          variant="outline"
          className="h-12"
          disabled={page + 1 >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
