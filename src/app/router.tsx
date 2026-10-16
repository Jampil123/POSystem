import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import {
  InventoryPage,
  LoginPage,
  PosPage,
  ProductsPage,
  ReportsPage,
  SettingsPage,
  ShiftsPage,
  TransactionsPage,
  UsersPage,
} from '@/app/lazyPages'
import { CrashScreen } from '@/components/common/CrashScreen'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { NotFoundScreen } from '@/components/common/NotFoundScreen'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/features/auth/components/RequireAuth'

// Pages load only when opened (see lazyPages.ts); AppShell shows a loading state meanwhile.

// RequireAuth sends logged-out users to /login and cashiers away from
// admin-only pages. Which pages are admin-only is set in navItems.ts.
// The database security rules block the same data even if a page is opened.
// errorElement shows a "Something went wrong" screen with Reload instead of a blank page.
export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <LoginPage />
      </Suspense>
    ),
    errorElement: <CrashScreen />,
  },
  {
    element: <RequireAuth />,
    errorElement: <CrashScreen />,
    children: [
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
          { path: '*', element: <NotFoundScreen /> },
        ],
      },
    ],
  },
])
