import { Loader2 } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SummaryBarProps = {
  itemCount: number
  total: number
  actionLabel: string
  actionDisabled: boolean
  isSaving: boolean
  onAction: () => void
  /** Fixed to the bottom of the screen (tablets and phones) instead of the column. */
  fixed: boolean
}

// Always shows "3 items · ₱105.00" and the next main action (UI guide 6.3).
export function SummaryBar({
  itemCount,
  total,
  actionLabel,
  actionDisabled,
  isSaving,
  onAction,
  fixed,
}: SummaryBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border bg-card p-3 max-md:landscape:py-1.5',
        fixed
          ? // Above the phone bottom navigation; beside the icon sidebar on tablets.
            'fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-x-0 border-b-0 md:bottom-0 md:left-20'
          : 'rounded-lg',
      )}
    >
      <p className="text-base font-semibold tabular-nums">
        {itemCount} {itemCount === 1 ? 'item' : 'items'} · <CurrencyText amount={total} />
      </p>
      <Button
        className="h-14 min-w-36 px-6 text-base max-md:landscape:h-12"
        disabled={actionDisabled || isSaving}
        onClick={onAction}
      >
        {isSaving && <Loader2 className="animate-spin" aria-hidden="true" />}
        {actionLabel}
      </Button>
    </div>
  )
}
