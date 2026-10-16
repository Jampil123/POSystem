import { useQuery } from '@tanstack/react-query'
import {
  getBestSellers,
  getDailySales,
  getLowStock,
  getReportSummary,
  getShiftSummary,
} from '@/features/reports/api'
import type { DateRange } from '@/features/reports/utils/dateRanges'

// Each part of the Reports page loads on its own, so each card, chart, and
// table can show its own loading, empty, and error state.
// `enabled` is false while a custom date range is not valid yet.

export const reportKeys = {
  all: ['reports'] as const,
  part: (name: string, range?: DateRange) => ['reports', name, range] as const,
}

export function useReportSummary(range: DateRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.part('summary', range),
    queryFn: () => getReportSummary(range),
    enabled,
  })
}

export function useDailySales(range: DateRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.part('daily', range),
    queryFn: () => getDailySales(range),
    enabled,
  })
}

export function useBestSellers(range: DateRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.part('best-sellers', range),
    queryFn: () => getBestSellers(range),
    enabled,
  })
}

export function useLowStock() {
  return useQuery({ queryKey: reportKeys.part('low-stock'), queryFn: getLowStock })
}

export function useShiftSummary(range: DateRange, enabled: boolean) {
  return useQuery({
    queryKey: reportKeys.part('shifts', range),
    queryFn: () => getShiftSummary(range),
    enabled,
  })
}
