import { lazy } from 'react'

// Each page is loaded only when it is opened, so the app starts faster.
export const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
export const PosPage = lazy(() => import('@/features/pos/PosPage'))
export const ProductsPage = lazy(() => import('@/features/products/ProductsPage'))
export const InventoryPage = lazy(() => import('@/features/inventory/InventoryPage'))
export const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage'))
export const ShiftsPage = lazy(() => import('@/features/shifts/ShiftsPage'))
export const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'))
export const UsersPage = lazy(() => import('@/features/users/UsersPage'))
export const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))
