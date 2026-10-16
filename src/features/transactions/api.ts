import type { QueryData } from '@supabase/supabase-js'
import type { VoidRefundValues } from '@/features/transactions/schema'
import type { Enums } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { manilaDayEnd, manilaDayStart } from '@/lib/manilaTime'

export type SaleStatus = Enums<'sale_status'>

export const PAGE_SIZE = 20

export type TransactionFilters = {
  /** yyyy-MM-dd (Manila) or '' */
  from: string
  /** yyyy-MM-dd (Manila) or '' */
  to: string
  cashierId: string | null
  status: SaleStatus | null
  /** Part of a receipt number, e.g. "123" */
  receipt: string
}

export const emptyTransactionFilters: TransactionFilters = {
  from: '',
  to: '',
  cashierId: null,
  status: null,
  receipt: '',
}

// ---------------------------------------------------------------------------
// List (cashiers only receive their own sales; admins receive all)
// ---------------------------------------------------------------------------

function transactionsQuery() {
  return supabase
    .from('sales')
    .select(
      'id, receipt_no, created_at, total, status, cashier:profiles!sales_cashier_id_fkey(full_name), items:sale_items(quantity)',
      { count: 'exact' },
    )
}

type TransactionRow = QueryData<ReturnType<typeof transactionsQuery>>[number]

export type TransactionListItem = Omit<TransactionRow, 'items'> & { itemCount: number }

export type TransactionPage = {
  transactions: TransactionListItem[]
  total: number
}

/** One page of sales, newest first. `page` starts at 0. */
export async function listTransactions(
  filters: TransactionFilters,
  page: number,
): Promise<TransactionPage> {
  let query = transactionsQuery()
  if (filters.from) query = query.gte('created_at', manilaDayStart(filters.from))
  if (filters.to) query = query.lt('created_at', manilaDayEnd(filters.to))
  if (filters.cashierId) query = query.eq('cashier_id', filters.cashierId)
  if (filters.status) query = query.eq('status', filters.status)
  const receipt = filters.receipt.replace(/\D/g, '')
  if (receipt) query = query.ilike('receipt_no', `%${receipt}%`)

  const start = page * PAGE_SIZE
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, start + PAGE_SIZE - 1)
  if (error) throw new Error('Could not load the transactions.')

  return {
    transactions: data.map(({ items, ...sale }) => ({
      ...sale,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    })),
    total: count ?? 0,
  }
}

/** Active cashiers and admins, for the cashier filter (admins only). */
export async function listCashiers(): Promise<{ id: string; full_name: string }[]> {
  const { data, error } = await supabase.from('profiles').select('id, full_name').order('full_name')
  if (error) throw new Error('Could not load the cashiers.')
  return data
}

// ---------------------------------------------------------------------------
// Details
// ---------------------------------------------------------------------------

function transactionQuery(saleId: number) {
  return supabase
    .from('sales')
    .select(
      `id, receipt_no, created_at, subtotal, discount, vat_amount, total, cash_received, change, status,
      cashier:profiles!sales_cashier_id_fkey(full_name),
      shift:shifts!sales_shift_id_fkey(id, opened_at, closed_at),
      items:sale_items(id, product_name, unit_price, quantity, line_total),
      reversal:sale_voids(type, reason, created_at,
        approver:profiles!sale_voids_approved_by_fkey(full_name),
        requester:profiles!sale_voids_requested_by_fkey(full_name))`,
    )
    .eq('id', saleId)
    .single()
}

export type TransactionDetails = QueryData<ReturnType<typeof transactionQuery>>

export async function getTransaction(saleId: number): Promise<TransactionDetails> {
  const { data, error } = await transactionQuery(saleId)
  if (error) throw new Error('Could not load the transaction.')
  return data
}

// ---------------------------------------------------------------------------
// Void and refund (database functions: all-or-nothing, PIN checked in the database)
// ---------------------------------------------------------------------------

/** The admin username or PIN was not accepted; shown in the dialog. */
export class ApprovalRejectedError extends Error {}

type ReversalResult = { ok: true } | { ok: false; message: string }

function readResult(value: unknown): ReversalResult {
  if (typeof value === 'object' && value !== null && 'ok' in value) {
    if (value.ok === true) return { ok: true }
    if ('message' in value && typeof value.message === 'string') {
      return { ok: false, message: value.message }
    }
  }
  return { ok: false, message: 'The approval could not be checked. Please try again.' }
}

export async function reverseSale(
  type: 'void' | 'refund',
  saleId: number,
  values: VoidRefundValues,
): Promise<void> {
  const { data, error } = await supabase.rpc(type === 'void' ? 'void_sale' : 'refund_sale', {
    p_sale_id: saleId,
    p_reason: values.reason,
    p_admin_username: values.admin_username,
    p_admin_pin: values.admin_pin,
  })
  if (error) {
    throw new Error(
      error.code === 'P0001' ? error.message : `Could not save the ${type}. Please try again.`,
    )
  }

  const result = readResult(data)
  if (!result.ok) throw new ApprovalRejectedError(result.message)
}
