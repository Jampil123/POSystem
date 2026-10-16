import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { CloseShiftForm } from '@/features/shifts/components/CloseShiftForm'
import { OpenShiftForm } from '@/features/shifts/components/OpenShiftForm'
import { ShiftTable } from '@/features/shifts/components/ShiftTable'
import { useCurrentShift } from '@/features/shifts/hooks/useShifts'

export default function ShiftsPage() {
  const currentShift = useCurrentShift()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Shifts" />

      {currentShift.isPending ? (
        <ListSkeleton rows={3} />
      ) : currentShift.isError ? (
        <ErrorState
          message="Could not load your shift."
          onRetry={() => void currentShift.refetch()}
        />
      ) : currentShift.data ? (
        <CloseShiftForm key={currentShift.data.id} shift={currentShift.data} />
      ) : (
        <OpenShiftForm />
      )}

      <section aria-labelledby="past-shifts-title" className="flex flex-col gap-3">
        <h2 id="past-shifts-title" className="text-lg font-semibold">
          Shifts
        </h2>
        <ShiftTable />
      </section>
    </div>
  )
}
