import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setProductActive } from '@/features/products/api'
import { productKeys } from '@/features/products/queryKeys'

// Deactivates or reactivates a product.
export function useSetProductActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setProductActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  })
}
