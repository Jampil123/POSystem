import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adjustStock, recordStockIn } from '@/features/inventory/api'
import { movementKeys } from '@/features/inventory/queryKeys'
import type { AdjustmentValues, StockInValues } from '@/features/inventory/schema'
import { productKeys } from '@/features/products/queryKeys'

// After any stock change, reload the products (stock on hand, Products page)
// and the movement history, so every tab shows the new stock right away.
function useRefreshStock() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
      queryClient.invalidateQueries({ queryKey: movementKeys.all }),
    ])
}

export function useRecordStockIn() {
  const refreshStock = useRefreshStock()
  return useMutation({
    mutationFn: (values: StockInValues) => recordStockIn(values),
    onSuccess: refreshStock,
  })
}

export function useAdjustStock() {
  const refreshStock = useRefreshStock()
  return useMutation({
    mutationFn: (values: AdjustmentValues) => adjustStock(values),
    onSuccess: refreshStock,
  })
}
