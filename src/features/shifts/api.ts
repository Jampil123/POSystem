import type { PostgrestError, QueryData } from '@supabase/supabase-js'
import type { ShiftSale } from '@/features/pos/utils/computeShiftCash'
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

/** Totals and statuses of the shift's sales, for the close shift summary. */
export async function getShiftSales(shiftId: number): Promise<ShiftSale[]> {
  const { data, error } = await supabase
    .from('sales')
    .select('total, status')
    .eq('shift_id', shiftId)
  if (error) throw new Error('Could not load the sales of this shift.')
  return data
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
      'id, opened_at, closed_at, starting_cash, expected_cash, actual_cash, difference, cashier:profiles(full_name)',
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
