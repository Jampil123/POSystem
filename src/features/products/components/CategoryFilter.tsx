import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CategoryListItem } from '@/features/products/api'

export const ALL_CATEGORIES = 'all'

type CategoryFilterProps = {
  /** A category id as text, or ALL_CATEGORIES. */
  value: string
  onChange: (value: string) => void
  categories: CategoryListItem[]
}

export function CategoryFilter({ value, onChange, categories }: CategoryFilterProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="category-filter">Category</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="category-filter" className="w-full data-[size=default]:h-12 md:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={String(category.id)}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
