import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completeSale, type CompleteSaleInput } from '@/features/pos/api'
import { productKeys } from '@/features/products/queryKeys'
import { shiftKeys } from '@/features/shifts/queryKeys'

// Calls the complete_sale database function.
// Success or failure, the product list is reloaded: after a sale the stock
// went down, and after a failure the cart can show which item ran out.
export function useCompleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CompleteSaleInput) => completeSale(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftKeys.all })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}
