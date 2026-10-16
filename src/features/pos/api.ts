import type { QueryData } from '@supabase/supabase-js'
import type { Tables } from '@/types/database'
import { supabase } from '@/lib/supabase'

export type Sale = Tables<'sales'>

export type CompleteSaleInput = {
  items: { productId: number; quantity: number }[]
  cashReceived: number
  /** Discount in pesos (a percent discount is turned into pesos first). */
  discount: number
}

const RAISED_BY_FUNCTION = 'P0001'

// complete_sale checks the shift, stock, and cash, then saves everything at once.
// Prices are taken from the database, not from the app.
export async function completeSale(input: CompleteSaleInput): Promise<Sale> {
  const { data, error } = await supabase.rpc('complete_sale', {
    p_items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    p_cash_received: input.cashReceived,
    p_discount: input.discount,
  })
  if (error) {
    // Messages raised by the function (e.g. "Bread Loaf is out of stock.") are written for users.
    throw new Error(
      error.code === RAISED_BY_FUNCTION
        ? error.message
        : 'Could not save the sale. Check the internet connection and try again.',
    )
  }
  return data
}

function receiptQuery(saleId: number) {
  return supabase
    .from('sales')
    .select(
      'id, receipt_no, created_at, subtotal, discount, vat_amount, total, cash_received, change, status, cashier:profiles(full_name), items:sale_items(id, product_name, unit_price, quantity, line_total)',
    )
    .eq('id', saleId)
    .single()
}

export type ReceiptSale = QueryData<ReturnType<typeof receiptQuery>>

// Everything printed on the receipt, as saved in the database.
export async function getReceiptSale(saleId: number): Promise<ReceiptSale> {
  const { data, error } = await receiptQuery(saleId)
  if (error) throw new Error('Could not load the receipt.')
  return data
}
