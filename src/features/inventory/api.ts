import type { PostgrestError, QueryData } from '@supabase/supabase-js'
import { addDays, parseISO, startOfDay } from 'date-fns'
import {
  adjustmentQuantityChange,
  adjustmentReasonText,
  todayDateString,
  type AdjustmentValues,
  type StockInValues,
} from '@/features/inventory/schema'
import type { MovementType } from '@/features/inventory/utils/movementLabels'
import { supabase } from '@/lib/supabase'

// Messages raised by the database functions (e.g. "Cannot remove more than the
// current stock (3).") are written for users, so they are shown as they are.
const RAISED_BY_FUNCTION = 'P0001'

function functionError(error: PostgrestError, fallback: string): Error {
  return new Error(error.code === RAISED_BY_FUNCTION ? error.message : fallback)
}

// ---------------------------------------------------------------------------
// Stock in and adjustments (database functions, so each save is all-or-nothing)
// ---------------------------------------------------------------------------

export async function recordStockIn(values: StockInValues): Promise<number> {
  const { data, error } = await supabase.rpc('record_stock_in', {
    p_items: values.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
    })),
    p_supplier_name: values.supplier_name || undefined,
    // Today uses the current time; an earlier date is saved at noon of that day.
    p_received_at:
      values.received_date === todayDateString()
        ? undefined
        : parseISO(`${values.received_date}T12:00:00`).toISOString(),
  })
  if (error) throw functionError(error, 'Could not save the stock in. Please try again.')
  return data
}

export async function adjustStock(values: AdjustmentValues): Promise<number> {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product_id: values.product_id,
    p_quantity_change: adjustmentQuantityChange(values),
    p_reason: adjustmentReasonText(values),
  })
  if (error) throw functionError(error, 'Could not save the adjustment. Please try again.')
  return data
}

// ---------------------------------------------------------------------------
// Movement history
// ---------------------------------------------------------------------------

export type MovementFilters = {
  /** yyyy-MM-dd or '' */
  from: string
  /** yyyy-MM-dd or '' */
  to: string
  productId: number | null
  type: MovementType | null
}

function movementsQuery() {
  return supabase
    .from('stock_movements')
    .select(
      'id, type, quantity_change, reference_id, created_at, product:products(name), user:profiles(full_name)',
    )
}

type MovementRow = QueryData<ReturnType<typeof movementsQuery>>[number]

export type MovementListItem = MovementRow & {
  /** e.g. "Receipt 000012", "Stock in #3 · Supplier A", "Adjustment #5 · Damaged" */
  referenceLabel: string
}

export type MovementPage = {
  movements: MovementListItem[]
  hasMore: boolean
}

export async function listMovements(
  filters: MovementFilters,
  limit: number,
): Promise<MovementPage> {
  let query = movementsQuery()
  if (filters.from)
    query = query.gte('created_at', startOfDay(parseISO(filters.from)).toISOString())
  if (filters.to) {
    query = query.lt('created_at', addDays(startOfDay(parseISO(filters.to)), 1).toISOString())
  }
  if (filters.productId !== null) query = query.eq('product_id', filters.productId)
  if (filters.type !== null) query = query.eq('type', filters.type)

  // One extra row tells whether there are more to show.
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)
  if (error) throw new Error('Could not load the stock history.')

  const rows = data.slice(0, limit)
  const labels = await loadReferenceLabels(rows)

  return {
    movements: rows.map((row) => ({
      ...row,
      referenceLabel: labels.get(`${row.type}:${row.reference_id}`) ?? '—',
    })),
    hasMore: data.length > limit,
  }
}

function idsOfType(rows: MovementRow[], types: MovementType[]): number[] {
  const ids = rows
    .filter((row) => types.includes(row.type) && row.reference_id !== null)
    .map((row) => row.reference_id as number)
  return [...new Set(ids)]
}

// Looks up receipt numbers, suppliers, and adjustment reasons for the rows shown.
async function loadReferenceLabels(rows: MovementRow[]): Promise<Map<string, string>> {
  const labels = new Map<string, string>()
  const saleIds = idsOfType(rows, ['sale', 'void', 'refund'])
  const stockInIds = idsOfType(rows, ['stock_in'])
  const adjustmentIds = idsOfType(rows, ['adjustment'])

  const [sales, stockIns, adjustments] = await Promise.all([
    saleIds.length
      ? supabase.from('sales').select('id, receipt_no').in('id', saleIds)
      : { data: [], error: null },
    stockInIds.length
      ? supabase.from('stock_ins').select('id, supplier_name, notes').in('id', stockInIds)
      : { data: [], error: null },
    adjustmentIds.length
      ? supabase.from('stock_adjustments').select('id, reason').in('id', adjustmentIds)
      : { data: [], error: null },
  ])
  if (sales.error || stockIns.error || adjustments.error) {
    throw new Error('Could not load the stock history.')
  }

  for (const sale of sales.data) {
    for (const type of ['sale', 'void', 'refund']) {
      labels.set(`${type}:${sale.id}`, `Receipt ${sale.receipt_no}`)
    }
  }
  for (const stockIn of stockIns.data) {
    const detail = stockIn.supplier_name ?? stockIn.notes
    labels.set(`stock_in:${stockIn.id}`, `Stock in #${stockIn.id}${detail ? ` · ${detail}` : ''}`)
  }
  for (const adjustment of adjustments.data) {
    labels.set(`adjustment:${adjustment.id}`, `Adjustment #${adjustment.id} · ${adjustment.reason}`)
  }
  return labels
}
