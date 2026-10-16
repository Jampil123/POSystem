import type { Tables } from '@/types/database'
import { supabase } from '@/lib/supabase'

export type StoreSettings = Tables<'store_settings'>

// Store name, address, VAT, and receipt footer (one row). Read by the POS and receipts.
// Editing these comes with the Settings page in Phase 6.
export async function getStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single()
  if (error) throw new Error('Could not load the store settings.')
  return data
}
