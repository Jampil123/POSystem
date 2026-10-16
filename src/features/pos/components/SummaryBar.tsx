import { Loader2 } from 'lucide-react'
import { CurrencyText } from '@/components/common/CurrencyText'
import { Button } from '@/components/ui/button'
import { useKeyboardOpen } from '@/hooks/useKeyboardOpen'
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
  // While typing (cash, discount, search), the fixed bar hides so it never covers the field.
  // The same action is still on the open step (for example "Complete sale" in Payment).
  const keyboardOpen = useKeyboardOpen()
  if (fixed && keyboardOpen) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border bg-card p-3 short:py-1.5!',
        fixed
          ? // Above the phone bottom navigation; beside the icon sidebar on tablets,
            // and above the home bar on iPads.
            'fixed right-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 z-30 border-x-0 border-b-0 pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))] md:bottom-0 md:left-[calc(5rem+env(safe-area-inset-left))] md:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pl-3'
          : 'rounded-lg',
      )}
    >
      <p className="text-base font-semibold tabular-nums">
        {itemCount} {itemCount === 1 ? 'item' : 'items'} · <CurrencyText amount={total} />
      </p>
      <Button
        className="h-14 min-w-36 px-6 text-base short:h-12!"
        disabled={actionDisabled || isSaving}
        onClick={onAction}
      >
        {isSaving && <Loader2 className="animate-spin" aria-hidden="true" />}
        {actionLabel}
      </Button>
    </div>
  )
}
