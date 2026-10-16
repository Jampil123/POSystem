import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  closeShift,
  getCurrentShift,
  getShiftCashSummary,
  listShifts,
  openShift,
} from '@/features/shifts/api'
import { shiftKeys } from '@/features/shifts/queryKeys'

/** The logged-in user's open shift (null when none). Used by the POS lock and the top bar. */
export function useCurrentShift() {
  const { profile } = useAuth()
  const userId = profile?.id
  return useQuery({
    queryKey: shiftKeys.current(userId),
    queryFn: userId ? () => getCurrentShift(userId) : skipToken,
  })
}

// Opening or closing a shift swaps the form on screen (open form <-> close form).
// The reload is started but not waited for, so the form's own success message
// runs before the form is replaced (otherwise the message is skipped).
export function useOpenShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (startingCash: number) => openShift(startingCash),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}

/** Starting cash, cash sales, refunds, and expected cash of a shift. */
export function useShiftCashSummary(shiftId: number) {
  return useQuery({
    queryKey: shiftKeys.cash(shiftId),
    queryFn: () => getShiftCashSummary(shiftId),
  })
}

export function useCloseShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shiftId, actualCash }: { shiftId: number; actualCash: number }) =>
      closeShift(shiftId, actualCash),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
  })
}

export function useShiftList() {
  return useQuery({ queryKey: shiftKeys.list, queryFn: listShifts })
}
