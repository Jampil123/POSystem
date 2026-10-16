import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { CategoryListItem, ProductListItem } from '@/features/products/api'
import { ProductForm } from '@/features/products/components/ProductForm'

type ProductFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null when adding a new product. */
  product: ProductListItem | null
  categories: CategoryListItem[]
}

// Side panel on tablets and desktops; full screen on phones.
export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  categories,
}: ProductFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">{product ? 'Edit product' : 'Add product'}</SheetTitle>
          <SheetDescription>
            {product ? product.name : 'Fill in the product details.'}
          </SheetDescription>
        </SheetHeader>
        {/* key resets the form when another product is opened */}
        <ProductForm
          key={product?.id ?? 'new'}
          product={product}
          categories={categories}
          onDone={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
