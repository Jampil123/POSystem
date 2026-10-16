import { format, isToday } from 'date-fns'
import { useCurrentShift } from '@/features/shifts/hooks/useShifts'

// Top bar text: "Shift open since 8:00 AM" or "No open shift" (UI guide section 5).
export function ShiftStatus() {
  const shift = useCurrentShift()

  if (shift.isPending) return null
  if (shift.isError) return <span className="text-muted-foreground">Shift status unavailable</span>
  if (!shift.data) return <span className="text-muted-foreground">No open shift</span>

  const openedAt = new Date(shift.data.opened_at)
  const time = format(openedAt, isToday(openedAt) ? 'h:mm a' : 'MMM d, h:mm a')
  return <span>Shift open since {time}</span>
}
