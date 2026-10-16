import type { SettingsValues } from '@/features/settings/schema'
import type { Tables } from '@/types/database'
import { supabase } from '@/lib/supabase'

export type StoreSettings = Tables<'store_settings'>

// Store name, address, VAT, receipt, and product defaults (one row, id = 1).
// Read by the POS, receipts, and the product form.
export async function getStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single()
  if (error) throw new Error('Could not load the store settings.')
  return data
}

// Admins only (security rules). VAT changes apply to new sales; past sales keep their saved VAT.
export async function updateStoreSettings(values: SettingsValues): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .update(values)
    .eq('id', 1)
    .select('*')
    .single()
  if (error) throw new Error('Could not save the settings. Please try again.')
  return data
}
