import { Lock } from 'lucide-react'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { PosCheckout } from '@/features/pos/components/PosCheckout'
import { OpenShiftForm } from '@/features/shifts/components/OpenShiftForm'
import { useCurrentShift } from '@/features/shifts/hooks/useShifts'

// The POS is locked until the user has an open shift (UI guide 6.2).
export default function PosPage() {
  const currentShift = useCurrentShift()

  if (currentShift.isPending) return <ListSkeleton rows={6} />
  if (currentShift.isError) {
    return (
      <ErrorState
        message="Could not load your shift."
        onRetry={() => void currentShift.refetch()}
      />
    )
  }

  if (!currentShift.data) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <p className="flex items-center gap-2 text-muted-foreground">
          <Lock className="size-4" aria-hidden="true" />
          The POS is locked until a shift is open.
        </p>
        <OpenShiftForm />
      </div>
    )
  }

  return <PosCheckout />
}
