import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, updateProduct } from '@/features/products/api'
import { categoryKeys, productKeys } from '@/features/products/queryKeys'
import type { ProductFormValues } from '@/features/products/schema'

type SaveProductInput = {
  /** Missing for a new product. */
  id?: number
  values: ProductFormValues
}

// Adds or edits a product, then refreshes the product list.
export function useSaveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: SaveProductInput) =>
      id === undefined ? createProduct(values) : updateProduct(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
      // Category product counts change when a product is added or moved.
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
