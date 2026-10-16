import type { TransactionFilters } from '@/features/transactions/api'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters, page: number) =>
    ['transactions', 'list', filters, page] as const,
  details: (saleId: number | null) => ['transactions', 'details', saleId] as const,
  cashiers: ['transactions', 'cashiers'] as const,
}
