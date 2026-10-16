import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listMovements, type MovementFilters } from '@/features/inventory/api'
import { movementKeys } from '@/features/inventory/queryKeys'

// Stock movement history, newest first. `limit` grows when "Show more" is pressed.
export function useStockMovements(filters: MovementFilters, limit: number) {
  return useQuery({
    queryKey: movementKeys.list(filters, limit),
    queryFn: () => listMovements(filters, limit),
    // Keep showing the current rows while more are loading.
    placeholderData: keepPreviousData,
  })
}
