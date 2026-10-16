import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from '@/features/products/api'
import { categoryKeys, productKeys } from '@/features/products/queryKeys'

// Categories with how many products use each one.
export function useCategories() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: listCategories })
}

// Adds a category, or renames one when an id is given.
export function useSaveCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id?: number; name: string }) =>
      id === undefined ? createCategory(name) : renameCategory(id, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      // Product rows show the category name.
      void queryClient.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
  })
}
