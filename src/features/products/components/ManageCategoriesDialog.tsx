import { useState } from 'react'
import { Pencil, Tags, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListSkeleton } from '@/components/common/ListSkeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CategoryListItem } from '@/features/products/api'
import { CategoryNameForm } from '@/features/products/components/CategoryNameForm'
import { useCategories, useDeleteCategory } from '@/features/products/hooks/useCategories'
import { errorMessage } from '@/lib/errors'

type ManageCategoriesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Add, rename, and remove categories. Full screen on phones.
export function ManageCategoriesDialog({ open, onOpenChange }: ManageCategoriesDialogProps) {
  const categories = useCategories()
  const deleteCategory = useDeleteCategory()
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [removing, setRemoving] = useState<CategoryListItem | null>(null)
  // Shown when someone tries to remove a category that still has products.
  const [blockedMessage, setBlockedMessage] = useState<{ id: number; text: string } | null>(null)

  function handleRemove(category: CategoryListItem) {
    if (category.productCount > 0) {
      const products =
        category.productCount === 1 ? '1 product' : `${category.productCount} products`
      setBlockedMessage({
        id: category.id,
        text: `“${category.name}” cannot be removed because ${products} still use it. Move them to another category first.`,
      })
      return
    }
    setBlockedMessage(null)
    setRemoving(category)
  }

  function confirmRemove() {
    if (!removing) return
    deleteCategory.mutate(removing.id, {
      onSuccess: () => {
        toast.success('Category removed')
        setRemoving(null)
      },
      onError: (error) => {
        toast.error(errorMessage(error))
        setRemoving(null)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col rounded-xl max-md:h-dvh max-md:max-h-dvh max-md:max-w-full max-md:rounded-none">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Categories group products on the Products and POS pages.
          </DialogDescription>
        </DialogHeader>

        <CategoryNameForm />

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {categories.isPending ? (
            <ListSkeleton rows={4} />
          ) : categories.isError ? (
            <ErrorState
              message="Could not load the categories."
              onRetry={() => void categories.refetch()}
            />
          ) : categories.data.length === 0 ? (
            <EmptyState icon={Tags} message="No categories yet. Add the first one above." />
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {categories.data.map((category) => (
                <li key={category.id} className="flex flex-col gap-2 p-3">
                  {renamingId === category.id ? (
                    <CategoryNameForm category={category} onDone={() => setRenamingId(null)} />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.productCount === 1
                            ? '1 product'
                            : `${category.productCount} products`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="h-12"
                          aria-label={`Rename ${category.name}`}
                          onClick={() => {
                            setBlockedMessage(null)
                            setRenamingId(category.id)
                          }}
                        >
                          <Pencil aria-hidden="true" />
                          Rename
                        </Button>
                        <Button
                          variant="outline"
                          className="h-12 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${category.name}`}
                          onClick={() => handleRemove(category)}
                        >
                          <Trash2 aria-hidden="true" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                  {blockedMessage?.id === category.id && (
                    <p role="alert" className="text-sm text-destructive">
                      {blockedMessage.text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(isOpen) => !isOpen && setRemoving(null)}
        title={`Remove “${removing?.name ?? ''}”?`}
        description="The category will be deleted. No products use it."
        confirmLabel="Remove"
        isPending={deleteCategory.isPending}
        onConfirm={confirmRemove}
      />
    </Dialog>
  )
}
