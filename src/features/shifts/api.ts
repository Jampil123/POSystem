import type { PostgrestError, QueryData } from '@supabase/supabase-js'
import type { Tables } from '@/types/database'
import { supabase } from '@/lib/supabase'

export type Shift = Tables<'shifts'>

const UNIQUE_VIOLATION = '23505'
const RAISED_BY_FUNCTION = 'P0001'

/** The user's open shift, or null when they have none. */
export async function getCurrentShift(userId: string): Promise<Shift | null> {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('cashier_id', userId)
    .is('closed_at', null)
    .maybeSingle()
  if (error) throw new Error('Could not load your shift.')
  return data
}

// cashier_id and opened_at are filled in by the database (the logged-in user, now).
export async function openShift(startingCash: number): Promise<Shift> {
  const { data, error } = await supabase
    .from('shifts')
    .insert({ starting_cash: startingCash })
    .select('*')
    .single()
  if (error?.code === UNIQUE_VIOLATION) throw new Error('You already have an open shift.')
  if (error) throw new Error('Could not open the shift. Please try again.')
  return data
}

export type ShiftCashSummary = {
  startingCash: number
  /** Sales made in the shift that were not voided. */
  cashSales: number
  /** Refunds paid out of this shift's drawer. */
  refunds: number
  /** Starting cash + cash sales − refunds. */
  expectedCash: number
}

// Worked out by the database with the same formula close_shift uses.
export async function getShiftCashSummary(shiftId: number): Promise<ShiftCashSummary> {
  const { data, error } = await supabase.rpc('shift_cash_summary', { p_shift_id: shiftId }).single()
  if (error) throw new Error('Could not load the cash summary of this shift.')
  return {
    startingCash: data.starting_cash,
    cashSales: data.cash_sales,
    refunds: data.refunds,
    expectedCash: data.expected_cash,
  }
}

function functionError(error: PostgrestError, fallback: string) {
  return new Error(error.code === RAISED_BY_FUNCTION ? error.message : fallback)
}

// close_shift computes and saves the expected cash and the difference.
export async function closeShift(shiftId: number, actualCash: number): Promise<Shift> {
  const { data, error } = await supabase.rpc('close_shift', {
    p_shift_id: shiftId,
    p_actual_cash: actualCash,
  })
  if (error) throw functionError(error, 'Could not close the shift. Please try again.')
  return data
}

function shiftsQuery() {
  return supabase
    .from('shifts')
    .select(
      'id, opened_at, closed_at, starting_cash, expected_cash, actual_cash, difference, cashier:profiles!shifts_cashier_id_fkey(full_name)',
    )
    .order('opened_at', { ascending: false })
    .limit(100)
}

export type ShiftListItem = QueryData<ReturnType<typeof shiftsQuery>>[number]

// Cashiers only get their own shifts (security rules); admins get everyone's.
export async function listShifts(): Promise<ShiftListItem[]> {
  const { data, error } = await shiftsQuery()
  if (error) throw new Error('Could not load the shifts.')
  return data
}
