import type { PostgrestError, QueryData } from '@supabase/supabase-js'
import type { ProductFormValues } from '@/features/products/schema'
import { supabase } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Thrown when another product already has the barcode, so the form can show it under the field. */
export class BarcodeTakenError extends Error {
  constructor() {
    super('Another product already uses this barcode.')
  }
}

const UNIQUE_VIOLATION = '23505'
const FOREIGN_KEY_VIOLATION = '23503'

function isUniqueViolation(error: PostgrestError, constraint: string) {
  return error.code === UNIQUE_VIOLATION && error.message.includes(constraint)
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

function productsQuery() {
  return supabase
    .from('products')
    .select(
      'id, name, barcode, category_id, cost_price, selling_price, stock_qty, low_stock_level, is_active, category:categories(name)',
    )
    .order('name')
}

export type ProductListItem = QueryData<ReturnType<typeof productsQuery>>[number]

export async function listProducts(): Promise<ProductListItem[]> {
  const { data, error } = await productsQuery()
  if (error) throw new Error('Could not load the products.')
  return data
}

// stock_qty is never sent: stock only changes through stock in and adjustments.
function toProductRow(values: ProductFormValues) {
  return {
    name: values.name,
    category_id: values.category_id,
    barcode: values.barcode,
    cost_price: values.cost_price,
    selling_price: values.selling_price,
    low_stock_level: values.low_stock_level,
    is_active: values.is_active,
  }
}

function productSaveError(error: PostgrestError): Error {
  if (isUniqueViolation(error, 'products_barcode_key')) return new BarcodeTakenError()
  if (error.code === FOREIGN_KEY_VIOLATION)
    return new Error('The chosen category no longer exists.')
  return new Error('Could not save the product. Please try again.')
}

export async function createProduct(values: ProductFormValues): Promise<void> {
  const { error } = await supabase.from('products').insert(toProductRow(values))
  if (error) throw productSaveError(error)
}

export async function updateProduct(id: number, values: ProductFormValues): Promise<void> {
  const { error } = await supabase.from('products').update(toProductRow(values)).eq('id', id)
  if (error) throw productSaveError(error)
}

// Products are deactivated instead of deleted, so old sales stay correct.
export async function setProductActive(id: number, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id)
  if (error) throw new Error('Could not update the product. Please try again.')
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type CategoryListItem = {
  id: number
  name: string
  productCount: number
}

export async function listCategories(): Promise<CategoryListItem[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, products(count)')
    .order('name')
  if (error) throw new Error('Could not load the categories.')

  return data.map((category) => ({
    id: category.id,
    name: category.name,
    productCount: category.products[0]?.count ?? 0,
  }))
}

function categorySaveError(error: PostgrestError): Error {
  if (isUniqueViolation(error, 'categories_name_unique')) {
    return new Error('A category with this name already exists.')
  }
  return new Error('Could not save the category. Please try again.')
}

export async function createCategory(name: string): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name })
  if (error) throw categorySaveError(error)
}

export async function renameCategory(id: number, name: string): Promise<void> {
  const { error } = await supabase.from('categories').update({ name }).eq('id', id)
  if (error) throw categorySaveError(error)
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    throw new Error('This category still has products. Move them to another category first.')
  }
  if (error) throw new Error('Could not remove the category. Please try again.')
}
