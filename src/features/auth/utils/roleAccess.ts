import { navItems, type NavItem } from '@/components/layout/navItems'
import type { Role } from '@/features/auth/types'

// Where users go after logging in, and where cashiers are sent from admin-only pages.
export const HOME_PATH = '/pos'

// Admins see every page. Cashiers see only pages not marked adminOnly
// (POS, Transactions, Shifts; see section 5 of the UI guide).
export function canSeeNavItem(role: Role, item: Pick<NavItem, 'adminOnly'>): boolean {
  return role === 'admin' || !item.adminOnly
}

export function getNavItemsForRole(role: Role): NavItem[] {
  return navItems.filter((item) => canSeeNavItem(role, item))
}

// Paths that are not in the menu (like "/") are allowed here; the router redirects them.
export function canAccessPath(role: Role, pathname: string): boolean {
  const item = navItems.find(
    (navItem) => pathname === navItem.path || pathname.startsWith(`${navItem.path}/`),
  )
  return !item || canSeeNavItem(role, item)
}
