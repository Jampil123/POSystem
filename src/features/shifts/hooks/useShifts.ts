import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import {
  closeShift,
  getCurrentShift,
  getShiftSales,
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

export function useOpenShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (startingCash: number) => openShift(startingCash),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shiftKeys.all }),
  })
}

/** Sales of a shift, for the close shift summary. */
export function useShiftSales(shiftId: number) {
  return useQuery({ queryKey: shiftKeys.sales(shiftId), queryFn: () => getShiftSales(shiftId) })
}

export function useCloseShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shiftId, actualCash }: { shiftId: number; actualCash: number }) =>
      closeShift(shiftId, actualCash),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shiftKeys.all }),
  })
}

export function useShiftList() {
  return useQuery({ queryKey: shiftKeys.list, queryFn: listShifts })
}
