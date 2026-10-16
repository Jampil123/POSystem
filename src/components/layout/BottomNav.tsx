import { MoreHorizontal } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useRole } from '@/features/auth/hooks/useRole'
import { getNavItemsForRole } from '@/features/auth/utils/roleAccess'
import { cn } from '@/lib/utils'

const itemClass =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

// Phone-only navigation.
// Admin: POS, Products, Inventory, Transactions, More. Cashier: POS, Transactions, More.
export function BottomNav() {
  const { pathname } = useLocation()
  const { role } = useRole()
  const items = role ? getNavItemsForRole(role) : []
  const mainItems = items.filter((item) => item.inBottomNav)
  const moreItems = items.filter((item) => !item.inBottomNav)
  const moreIsActive = moreItems.some((item) => pathname.startsWith(item.path))

  return (
    <nav
      aria-label="Main menu"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {mainItems.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => cn(itemClass, isActive && 'bg-accent')}
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}

      <Sheet>
        <SheetTrigger className={cn(itemClass, moreIsActive && 'bg-accent')}>
          <MoreHorizontal className="size-5" aria-hidden="true" />
          More
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-4">
            {moreItems.map(({ label, path, icon: Icon }) => (
              // SheetClose closes the sheet after a link is tapped
              <SheetClose key={path} asChild>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium',
                      isActive && 'bg-accent',
                    )
                  }
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </NavLink>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
