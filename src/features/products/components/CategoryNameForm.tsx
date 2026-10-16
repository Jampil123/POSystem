import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSaveCategory } from '@/features/products/hooks/useCategories'
import { categorySchema, type CategoryFormValues } from '@/features/products/schema'

type CategoryNameFormProps = {
  /** Set when renaming; missing when adding a new category. */
  category?: { id: number; name: string }
  onDone?: () => void
}

// Used to add a category (top of the dialog) and to rename one (inside a row).
export function CategoryNameForm({ category, onDone }: CategoryNameFormProps) {
  const saveCategory = useSaveCategory()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? '' },
  })
  const isRename = category !== undefined

  function handleSubmit({ name }: CategoryFormValues) {
    saveCategory.mutate(
      { id: category?.id, name },
      {
        onSuccess: () => {
          toast.success(isRename ? 'Category renamed' : 'Category added')
          form.reset({ name: '' })
          onDone?.()
        },
        // Errors such as a duplicate name are shown under the field.
        onError: (error) => form.setError('name', { message: error.message }),
      },
    )
  }

  return (
    <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isRename ? `New name for “${category.name}”` : 'New category'}</FormLabel>
              <div className="flex flex-wrap gap-2">
                <FormControl>
                  <Input
                    className="h-12 min-w-40 flex-1"
                    autoComplete="off"
                    autoFocus={isRename}
                    {...field}
                  />
                </FormControl>
                {isRename && (
                  <Button type="button" variant="outline" className="h-12" onClick={onDone}>
                    Cancel
                  </Button>
                )}
                {/* Only the Add button is yellow, so the dialog has one main action. */}
                <Button
                  type="submit"
                  variant={isRename ? 'outline' : 'default'}
                  className="h-12"
                  disabled={saveCategory.isPending}
                >
                  {saveCategory.isPending && (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  )}
                  {isRename ? 'Save' : 'Add'}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
