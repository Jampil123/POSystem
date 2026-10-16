import { skipToken, useQuery } from '@tanstack/react-query'
import { getReceiptSale } from '@/features/pos/api'

// The saved sale with its items and cashier name, for the receipt.
export function useReceiptSale(saleId: number | null) {
  return useQuery({
    queryKey: ['receipt', saleId],
    queryFn: saleId === null ? skipToken : () => getReceiptSale(saleId),
  })
}
