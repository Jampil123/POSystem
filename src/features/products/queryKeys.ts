// TanStack Query keys for products and categories.
// Inventory uses productKeys too, so stock changes refresh the product list.
export const productKeys = {
  all: ['products'] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
}
