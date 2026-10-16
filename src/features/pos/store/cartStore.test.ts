import { cartItemProblem, useCartStore, type CartProduct } from '@/features/pos/store/cartStore'

const bread: CartProduct = {
  id: 1,
  name: 'Bread',
  selling_price: 20,
  stock_qty: 3,
  is_active: true,
}
const water: CartProduct = {
  id: 2,
  name: 'Water',
  selling_price: 18,
  stock_qty: 10,
  is_active: true,
}

const cart = () => useCartStore.getState()
const quantityOf = (productId: number) =>
  cart().items.find((item) => item.productId === productId)?.quantity

beforeEach(() => {
  cart().clearCart()
})

describe('cart store', () => {
  it('adds a product with quantity 1, then adds one more on the next tap', () => {
    cart().addItem(bread)
    cart().addItem(bread)
    expect(cart().items).toHaveLength(1)
    expect(quantityOf(1)).toBe(2)
  })

  it('never goes above the available stock when adding', () => {
    expect(cart().addItem(bread)).toBe('added')
    cart().addItem(bread)
    cart().addItem(bread)
    expect(cart().addItem(bread)).toBe('at-stock-limit')
    expect(quantityOf(1)).toBe(3)
  })

  it('does not add an out-of-stock product', () => {
    expect(cart().addItem({ ...bread, stock_qty: 0 })).toBe('out-of-stock')
    expect(cart().items).toHaveLength(0)
  })

  it('does not add an inactive product', () => {
    expect(cart().addItem({ ...bread, is_active: false })).toBe('out-of-stock')
  })

  it('keeps a changed quantity between 1 and the stock', () => {
    cart().addItem(bread)
    cart().setQuantity(1, 99)
    expect(quantityOf(1)).toBe(3)
    cart().setQuantity(1, 0)
    expect(quantityOf(1)).toBe(1)
    cart().setQuantity(1, 2)
    expect(quantityOf(1)).toBe(2)
  })

  it('removes an item', () => {
    cart().addItem(bread)
    cart().addItem(water)
    cart().removeItem(1)
    expect(cart().items.map((item) => item.productId)).toEqual([2])
  })

  it('clears the cart, discount, cash, and goes back to Step 1', () => {
    cart().addItem(bread)
    cart().setDiscount('percent', '10')
    cart().setCashReceived('200')
    cart().setOpenStep('payment')

    cart().clearCart()

    expect(cart()).toMatchObject({
      items: [],
      discountType: 'amount',
      discountValue: '',
      cashReceived: '',
      openStep: 'items',
    })
  })

  it('updates price and stock from the latest products', () => {
    cart().addItem(water)
    cart().syncProducts([{ ...water, selling_price: 20, stock_qty: 4 }])
    expect(cart().items[0]).toMatchObject({ unitPrice: 20, stockQty: 4 })
  })

  it('marks a product that ran out while in the cart', () => {
    cart().addItem(bread)
    cart().addItem(bread)
    cart().syncProducts([{ ...bread, stock_qty: 1 }])
    expect(cartItemProblem(cart().items[0])).toBe('Only 1 left')

    cart().syncProducts([{ ...bread, stock_qty: 0 }])
    expect(cartItemProblem(cart().items[0])).toBe('Out of stock')
  })

  it('marks a product that was deactivated', () => {
    cart().addItem(bread)
    cart().syncProducts([{ ...bread, is_active: false }])
    expect(cartItemProblem(cart().items[0])).toBe('Out of stock')
  })

  it('saves the cart in sessionStorage so a refresh keeps it', () => {
    cart().addItem(water)
    cart().setCashReceived('100')
    const saved = JSON.parse(sessionStorage.getItem('kuya-tata-pos-cart') ?? '{}')
    expect(saved.state.items[0].productId).toBe(2)
    expect(saved.state.cashReceived).toBe('100')
  })
})
