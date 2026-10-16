import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BarChart3,
  Clock,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Warehouse,
} from 'lucide-react'

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  adminOnly: boolean
  /** Shown directly in the phone bottom bar; the rest go under "More". */
  inBottomNav: boolean
}

// Menu order follows section 5 of the UI guide.
// adminOnly pages are hidden from cashiers and blocked for them by RequireAuth
// (see src/features/auth/utils/roleAccess.ts).
export const navItems: NavItem[] = [
  { label: 'POS', path: '/pos', icon: ShoppingCart, adminOnly: false, inBottomNav: true },
  { label: 'Products', path: '/products', icon: Package, adminOnly: true, inBottomNav: true },
  { label: 'Inventory', path: '/inventory', icon: Warehouse, adminOnly: true, inBottomNav: true },
  {
    label: 'Transactions',
    path: '/transactions',
    icon: ArrowLeftRight,
    adminOnly: false,
    inBottomNav: true,
  },
  { label: 'Shifts', path: '/shifts', icon: Clock, adminOnly: false, inBottomNav: false },
  { label: 'Reports', path: '/reports', icon: BarChart3, adminOnly: true, inBottomNav: false },
  { label: 'Users', path: '/users', icon: Users, adminOnly: true, inBottomNav: false },
  { label: 'Settings', path: '/settings', icon: Settings, adminOnly: true, inBottomNav: false },
]
