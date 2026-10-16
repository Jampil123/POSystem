import { useState } from 'react'
import { Package, Plus, SearchX, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { BarcodeScanButton } from '@/components/common/BarcodeScanButton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductListItem } from '@/features/products/api'
import { ALL_CATEGORIES, CategoryFilter } from '@/features/products/components/CategoryFilter'
import { ManageCategoriesDialog } from '@/features/products/components/ManageCategoriesDialog'
import { ProductFormSheet } from '@/features/products/components/ProductFormSheet'
import { ProductTable } from '@/features/products/components/ProductTable'
import { useCategories } from '@/features/products/hooks/useCategories'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useSetProductActive } from '@/features/products/hooks/useSetProductActive'
import { errorMessage } from '@/lib/errors'

function matchesSearch(product: ProductListItem, search: string) {
  const text = search.trim().toLowerCase()
  if (!text) return true
  return product.name.toLowerCase().includes(text) || (product.barcode ?? '').includes(text)
}

export default function ProductsPage() {
  const products = useProducts()
  const categories = useCategories()
  const setProductActive = useSetProductActive()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductListItem | null>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [deactivating, setDeactivating] = useState<ProductListItem | null>(null)

  const visibleProducts = (products.data ?? []).filter(
    (product) =>
      matchesSearch(product, search) &&
      (categoryFilter === ALL_CATEGORIES || String(product.category_id) === categoryFilter),
  )

  function openForm(product: ProductListItem | null) {
    setEditing(product)
    setFormOpen(true)
  }

  function changeActive(product: ProductListItem, isActive: boolean) {
    setProductActive.mutate(
      { id: product.id, isActive },
      {
        onSuccess: () => {
          toast.success(isActive ? 'Product activated' : 'Product deactivated')
          setDeactivating(null)
        },
        onError: (error) => {
          toast.error(errorMessage(error))
          setDeactivating(null)
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Products"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-12" onClick={() => setCategoriesOpen(true)}>
              <Tags aria-hidden="true" />
              Manage categories
            </Button>
            <Button className="h-12" onClick={() => openForm(null)}>
              <Plus aria-hidden="true" />
              Add product
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid flex-1 gap-2">
          <Label htmlFor="product-search">Search</Label>
          <div className="flex gap-2">
            <Input
              id="product-search"
              type="search"
              className="h-12"
              placeholder="Name or barcode"
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <BarcodeScanButton onScan={setSearch} />
          </div>
        </div>
        <CategoryFilter
          value={categoryFilter}
          onChange={setCategoryFilter}
          categories={categories.data ?? []}
        />
      </div>

      {products.isPending ? (
        <ListSkeleton rows={6} />
      ) : products.isError ? (
        <ErrorState
          message="Could not load the products."
          onRetry={() => void products.refetch()}
        />
      ) : products.data.length === 0 ? (
        <EmptyState
          icon={Package}
          message="No products yet"
          action={
            <Button variant="outline" className="h-12" onClick={() => openForm(null)}>
              <Plus aria-hidden="true" />
              Add product
            </Button>
          }
        />
      ) : visibleProducts.length === 0 ? (
        <EmptyState icon={SearchX} message="No products match the search or category." />
      ) : (
        <ProductTable
          products={visibleProducts}
          onEdit={(product) => openForm(product)}
          onToggleActive={(product) =>
            product.is_active ? setDeactivating(product) : changeActive(product, true)
          }
        />
      )}

      <ProductFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={categories.data ?? []}
      />

      <ManageCategoriesDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title={`Deactivate “${deactivating?.name ?? ''}”?`}
        description="It will no longer be sold. Its past sales and stock history are kept, and you can activate it again later."
        confirmLabel="Deactivate"
        isPending={setProductActive.isPending}
        onConfirm={() => deactivating && changeActive(deactivating, false)}
      />
    </div>
  )
}
