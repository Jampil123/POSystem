import { NavLink } from 'react-router'
import { useRole } from '@/features/auth/hooks/useRole'
import { getNavItemsForRole } from '@/features/auth/utils/roleAccess'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { role } = useRole()
  const items = role ? getNavItemsForRole(role) : []

  return (
    // The left padding keeps the menu clear of the notch on phones in landscape.
    <aside className="sticky top-0 hidden h-dvh w-[calc(5rem+env(safe-area-inset-left))] shrink-0 flex-col border-r border-border bg-card pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] md:flex xl:w-[calc(15rem+env(safe-area-inset-left))]">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4 max-xl:justify-center">
        <img src="/icons/logo.svg" alt="" className="size-9" />
        <span className="hidden font-semibold xl:inline">Kuya Tata POS</span>
      </div>

      <nav aria-label="Main menu" className="flex flex-col gap-1 overflow-y-auto p-2">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={label}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 items-center gap-3 rounded-lg border-l-4 border-transparent px-3 text-sm font-medium text-foreground max-xl:justify-center',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                'hover:bg-muted',
                // Active item: yellow tint, dark text, yellow left marker
                isActive && 'border-primary bg-accent hover:bg-accent',
              )
            }
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="max-xl:sr-only">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
