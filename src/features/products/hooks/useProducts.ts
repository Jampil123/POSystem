import { useQuery } from '@tanstack/react-query'
import { listProducts } from '@/features/products/api'
import { productKeys } from '@/features/products/queryKeys'

// All products (active and inactive) with their category name.
// Search and category filters run in the page, since a small store has few products.
export function useProducts() {
  return useQuery({ queryKey: productKeys.all, queryFn: listProducts })
}
