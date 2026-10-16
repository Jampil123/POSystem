import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DiscountType } from '@/features/pos/utils/computeTotals'

export type PosStep = 'items' | 'review' | 'payment'

export type CartItem = {
  productId: number
  name: string
  unitPrice: number
  /** Stock available for this product, from the latest product list. */
  stockQty: number
  quantity: number
}

/** The product fields the cart needs. */
export type CartProduct = {
  id: number
  name: string
  selling_price: number
  stock_qty: number
  is_active: boolean
}

export type AddItemResult = 'added' | 'out-of-stock' | 'at-stock-limit'

type CartState = {
  items: CartItem[]
  discountType: DiscountType
  /** Text typed in the discount field. */
  discountValue: string
  /** Text typed in the cash received field. */
  cashReceived: string
  /** The open step; null when the cashier collapsed it. */
  openStep: PosStep | null
  /** Product search text and category chip in Step 1. */
  search: string
  categoryId: number | null

  addItem: (product: CartProduct) => AddItemResult
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  setDiscount: (type: DiscountType, value: string) => void
  setCashReceived: (value: string) => void
  setOpenStep: (step: PosStep | null) => void
  setSearch: (search: string) => void
  setCategoryId: (categoryId: number | null) => void
  /** Updates names, prices, and stock from the latest product list. */
  syncProducts: (products: CartProduct[]) => void
}

const emptySale = {
  items: [] as CartItem[],
  discountType: 'amount' as DiscountType,
  discountValue: '',
  cashReceived: '',
  openStep: 'items' as PosStep | null,
}

// The cart lives outside the components, so rotating the device or changing
// the layout never clears it. It is also saved in sessionStorage, so an
// accidental page refresh does not lose it (it is cleared when the tab closes).
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...emptySale,
      search: '',
      categoryId: null,

      addItem: (product) => {
        if (!product.is_active || product.stock_qty <= 0) return 'out-of-stock'

        const existing = get().items.find((item) => item.productId === product.id)
        if (existing && existing.quantity >= product.stock_qty) return 'at-stock-limit'

        set((state) => ({
          items: existing
            ? state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + 1, stockQty: product.stock_qty }
                  : item,
              )
            : [
                ...state.items,
                {
                  productId: product.id,
                  name: product.name,
                  unitPrice: product.selling_price,
                  stockQty: product.stock_qty,
                  quantity: 1,
                },
              ],
        }))
        return 'added'
      },

      // Quantity stays between 1 and the available stock. Use removeItem to take it out.
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.max(1, Math.min(Math.floor(quantity), item.stockQty)) }
              : item,
          ),
        })),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),

      // Also used after a completed sale: everything resets and Step 1 opens.
      clearCart: () => set({ ...emptySale }),

      setDiscount: (discountType, discountValue) => set({ discountType, discountValue }),
      setCashReceived: (cashReceived) => set({ cashReceived }),
      setOpenStep: (openStep) => set({ openStep }),
      setSearch: (search) => set({ search }),
      setCategoryId: (categoryId) => set({ categoryId }),

      syncProducts: (products) =>
        set((state) => ({
          items: state.items.map((item) => {
            const product = products.find((candidate) => candidate.id === item.productId)
            // A product that was deactivated or removed can no longer be sold.
            if (!product || !product.is_active) return { ...item, stockQty: 0 }
            return {
              ...item,
              name: product.name,
              unitPrice: product.selling_price,
              stockQty: product.stock_qty,
            }
          }),
        })),
    }),
    {
      name: 'kuya-tata-pos-cart',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        items: state.items,
        discountType: state.discountType,
        discountValue: state.discountValue,
        cashReceived: state.cashReceived,
        openStep: state.openStep,
      }),
    },
  ),
)

/**
 * Why a cart line cannot be sold right now, or null when it is fine.
 * Shown in red on the cart row (for example after a sale failed because stock ran out).
 */
export function cartItemProblem(item: CartItem): string | null {
  if (item.stockQty <= 0) return 'Out of stock'
  if (item.quantity > item.stockQty) return `Only ${item.stockQty} left`
  return null
}
