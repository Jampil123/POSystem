import type { DateRange } from '@/features/reports/utils/dateRanges'
import { supabase } from '@/lib/supabase'

// All report numbers are computed by database functions (admin only):
// Philippine days, voided sales left out, refunds subtracted on the refund day.

function rangeArgs(range: DateRange) {
  return { p_from: range.from, p_to: range.to }
}

const LOAD_ERROR = 'Could not load the report.'

export type ReportSummary = {
  totalSales: number
  transactionCount: number
  itemsSold: number
  averageSale: number
  refunds: number
  /** null when no sale in the range has cost data. */
  grossProfit: number | null
  /** Sales made before costs were saved, so they are left out of gross profit. */
  salesWithoutCost: number
  lowStockCount: number
}

export async function getReportSummary(range: DateRange): Promise<ReportSummary> {
  const { data, error } = await supabase.rpc('report_summary', rangeArgs(range)).single()
  if (error) throw new Error(LOAD_ERROR)
  return {
    totalSales: data.total_sales,
    transactionCount: data.transaction_count,
    itemsSold: data.items_sold,
    averageSale: data.average_sale,
    refunds: data.refunds,
    grossProfit: data.gross_profit,
    salesWithoutCost: data.sales_without_cost,
    lowStockCount: data.low_stock_count,
  }
}

export type DailySales = { day: string; totalSales: number; transactionCount: number }

export async function getDailySales(range: DateRange): Promise<DailySales[]> {
  const { data, error } = await supabase.rpc('report_daily_sales', rangeArgs(range))
  if (error) throw new Error(LOAD_ERROR)
  return data.map((row) => ({
    day: row.day,
    totalSales: row.total_sales,
    transactionCount: row.transaction_count,
  }))
}

export type BestSeller = { productId: number; name: string; quantity: number; sales: number }

export async function getBestSellers(range: DateRange): Promise<BestSeller[]> {
  const { data, error } = await supabase.rpc('report_best_sellers', {
    ...rangeArgs(range),
    p_limit: 10,
  })
  if (error) throw new Error(LOAD_ERROR)
  return data.map((row) => ({
    productId: row.product_id,
    name: row.product_name,
    quantity: row.quantity,
    sales: row.sales,
  }))
}

export type LowStockItem = {
  productId: number
  name: string
  category: string
  stockQty: number
  lowStockLevel: number
}

export async function getLowStock(): Promise<LowStockItem[]> {
  const { data, error } = await supabase.rpc('report_low_stock')
  if (error) throw new Error(LOAD_ERROR)
  return data.map((row) => ({
    productId: row.product_id,
    name: row.product_name,
    category: row.category_name,
    stockQty: row.stock_qty,
    lowStockLevel: row.low_stock_level,
  }))
}

export type ShiftSummaryRow = {
  shiftId: number
  cashier: string
  openedAt: string
  closedAt: string | null
  startingCash: number
  /** null while the shift is open. */
  expectedCash: number | null
  actualCash: number | null
  difference: number | null
}

export async function getShiftSummary(range: DateRange): Promise<ShiftSummaryRow[]> {
  const { data, error } = await supabase.rpc('report_shift_summary', rangeArgs(range))
  if (error) throw new Error(LOAD_ERROR)
  return data.map((row) => ({
    shiftId: row.shift_id,
    cashier: row.cashier_name,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    startingCash: row.starting_cash,
    expectedCash: row.expected_cash,
    actualCash: row.actual_cash,
    difference: row.difference,
  }))
}

/** Everything that goes into the Excel and PDF exports. */
export type ReportExportData = {
  storeName: string
  range: DateRange
  summary: ReportSummary
  bestSellers: BestSeller[]
  lowStock: LowStockItem[]
  shifts: ShiftSummaryRow[]
}
