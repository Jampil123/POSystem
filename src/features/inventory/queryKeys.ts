import type { MovementFilters } from '@/features/inventory/api'

// TanStack Query keys for inventory. Stock itself lives in the product list (productKeys).
export const movementKeys = {
  all: ['stock-movements'] as const,
  list: (filters: MovementFilters, limit: number) => ['stock-movements', filters, limit] as const,
}
