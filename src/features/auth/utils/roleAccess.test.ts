import { canAccessPath, getNavItemsForRole } from '@/features/auth/utils/roleAccess'

const labels = (role: 'admin' | 'cashier') => getNavItemsForRole(role).map((item) => item.label)

describe('getNavItemsForRole', () => {
  it('shows cashiers only POS, Transactions, and Shifts', () => {
    expect(labels('cashier')).toEqual(['POS', 'Transactions', 'Shifts'])
  })

  it('shows admins every menu item', () => {
    expect(labels('admin')).toEqual([
      'POS',
      'Products',
      'Inventory',
      'Transactions',
      'Shifts',
      'Reports',
      'Users',
      'Settings',
    ])
  })
})

describe('canAccessPath', () => {
  it.each(['/pos', '/transactions', '/shifts'])('lets cashiers open %s', (path) => {
    expect(canAccessPath('cashier', path)).toBe(true)
  })

  it.each(['/products', '/inventory', '/reports', '/users', '/settings'])(
    'blocks cashiers from %s',
    (path) => {
      expect(canAccessPath('cashier', path)).toBe(false)
    },
  )

  it('blocks cashiers from pages inside an admin-only section', () => {
    expect(canAccessPath('cashier', '/products/12')).toBe(false)
  })

  it('does not confuse similar path names', () => {
    // "/settingsx" is not the Settings page, so it is not matched as "/settings"
    expect(canAccessPath('cashier', '/settingsx')).toBe(true)
  })

  it.each(['/pos', '/products', '/inventory', '/reports', '/users', '/settings'])(
    'lets admins open %s',
    (path) => {
      expect(canAccessPath('admin', path)).toBe(true)
    },
  )
})
