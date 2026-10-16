import {
  keepPreviousData,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { movementKeys } from '@/features/inventory/queryKeys'
import { productKeys } from '@/features/products/queryKeys'
import { shiftKeys } from '@/features/shifts/queryKeys'
import {
  getTransaction,
  listCashiers,
  listTransactions,
  reverseSale,
  type TransactionFilters,
} from '@/features/transactions/api'
import { transactionKeys } from '@/features/transactions/queryKeys'
import type { VoidRefundValues } from '@/features/transactions/schema'

export function useTransactions(filters: TransactionFilters, page: number) {
  return useQuery({
    queryKey: transactionKeys.list(filters, page),
    queryFn: () => listTransactions(filters, page),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export function useTransaction(saleId: number | null) {
  return useQuery({
    queryKey: transactionKeys.details(saleId),
    queryFn: saleId === null ? skipToken : () => getTransaction(saleId),
  })
}

export function useCashiers(enabled: boolean) {
  return useQuery({ queryKey: transactionKeys.cashiers, queryFn: listCashiers, enabled })
}

// Void or refund, then reload everything that changed: the sale, stock,
// stock history, shift cash, and reports.
export function useReverseSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      type,
      saleId,
      values,
    }: {
      type: 'void' | 'refund'
      saleId: number
      values: VoidRefundValues
    }) => reverseSale(type, saleId, values),
    onSuccess: () =>
      Promise.all(
        [
          transactionKeys.all,
          productKeys.all,
          movementKeys.all,
          shiftKeys.all,
          ['reports'],
          ['receipt'],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  })
}
