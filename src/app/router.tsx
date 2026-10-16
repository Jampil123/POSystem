import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/features/auth/LoginPage'
import InventoryPage from '@/features/inventory/InventoryPage'
import PosPage from '@/features/pos/PosPage'
import ProductsPage from '@/features/products/ProductsPage'
import ReportsPage from '@/features/reports/ReportsPage'
import SettingsPage from '@/features/settings/SettingsPage'
import ShiftsPage from '@/features/shifts/ShiftsPage'
import TransactionsPage from '@/features/transactions/TransactionsPage'
import UsersPage from '@/features/users/UsersPage'

// Role-based route protection is added in Phase 2.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/pos" replace /> },
      { path: 'pos', element: <PosPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'shifts', element: <ShiftsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/pos" replace /> },
    ],
  },
])
