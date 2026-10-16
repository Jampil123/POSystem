// @vitest-environment node
import { createAdminUsersHandler, type AdminUsersDeps } from '@functions/admin-users/handler.ts'
import type { AccountSummary } from '@functions/_shared/userRules.ts'

// Tests the admin-users Edge Function's request handling with fake data:
// tokens map to users, and every write is recorded instead of saved.

const accounts: Record<string, AccountSummary> = {
  owner: { id: 'owner', role: 'admin', is_active: true },
  juan: { id: 'juan', role: 'cashier', is_active: true },
  former: { id: 'former', role: 'admin', is_active: false },
}

const tokens: Record<string, string> = {
  'owner-token': 'owner',
  'juan-token': 'juan',
  'former-token': 'former',
}

function setup() {
  const writes: string[] = []
  const deps: AdminUsersDeps = {
    getUserIdFromToken: async (token) => tokens[token] ?? null,
    getAccount: async (userId) => accounts[userId] ?? null,
    countActiveAdmins: async () =>
      Object.values(accounts).filter((account) => account.role === 'admin' && account.is_active)
        .length,
    usernameExists: async (username) => username === 'juan',
    createUser: async ({ email }) => {
      writes.push(`create ${email}`)
      return 'new-id'
    },
    updateProfile: async (userId) => {
      writes.push(`update ${userId}`)
    },
    setLoginBlocked: async (userId, blocked) => {
      writes.push(`${blocked ? 'block' : 'unblock'} ${userId}`)
    },
    setPassword: async (userId) => {
      writes.push(`password ${userId}`)
    },
    clearApprovalPin: async (userId) => {
      writes.push(`pin ${userId}`)
    },
  }
  return { handle: createAdminUsersHandler(deps), writes }
}

function post(body: unknown, token?: string) {
  return new Request('https://example.test/functions/v1/admin-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

const newCashier = {
  action: 'create',
  fullName: 'Maria Santos',
  username: 'maria',
  password: 'secret123',
  role: 'cashier',
}

describe('admin-users Edge Function', () => {
  it('rejects a request without a login', async () => {
    const { handle, writes } = setup()
    const response = await handle(post(newCashier))
    expect(response.status).toBe(401)
    expect(writes).toEqual([])
  })

  it('rejects an invalid login token', async () => {
    const { handle, writes } = setup()
    const response = await handle(post(newCashier, 'made-up-token'))
    expect(response.status).toBe(401)
    expect(writes).toEqual([])
  })

  it('rejects a cashier', async () => {
    const { handle, writes } = setup()
    const response = await handle(post(newCashier, 'juan-token'))
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Only an admin can manage users.' })
    expect(writes).toEqual([])
  })

  it('rejects an admin whose account is turned off', async () => {
    const { handle, writes } = setup()
    const response = await handle(post(newCashier, 'former-token'))
    expect(response.status).toBe(403)
    expect(writes).toEqual([])
  })

  it('lets an active admin add a user with the internal email', async () => {
    const { handle, writes } = setup()
    const response = await handle(post(newCashier, 'owner-token'))
    expect(response.status).toBe(200)
    expect(writes).toEqual(['create maria@kuyatata.local'])
  })

  it('rejects a username that is already taken', async () => {
    const { handle } = setup()
    const response = await handle(post({ ...newCashier, username: 'juan' }, 'owner-token'))
    expect(response.status).toBe(409)
  })

  it('does not let an admin deactivate their own account', async () => {
    const { handle, writes } = setup()
    const response = await handle(
      post(
        { action: 'update', userId: 'owner', fullName: 'Owner', role: 'admin', isActive: false },
        'owner-token',
      ),
    )
    expect(response.status).toBe(400)
    expect(writes).toEqual([])
  })

  it('turns off a cashier and blocks their login', async () => {
    const { handle, writes } = setup()
    const response = await handle(
      post(
        { action: 'update', userId: 'juan', fullName: 'Juan', role: 'cashier', isActive: false },
        'owner-token',
      ),
    )
    expect(response.status).toBe(200)
    expect(writes).toEqual(['update juan', 'block juan'])
  })

  it('resets a password and an approval PIN', async () => {
    const { handle, writes } = setup()
    await handle(
      post({ action: 'reset-password', userId: 'juan', password: 'newpass123' }, 'owner-token'),
    )
    await handle(post({ action: 'reset-pin', userId: 'owner' }, 'owner-token'))
    expect(writes).toEqual(['password juan', 'pin owner'])
  })

  it('answers the browser CORS check', async () => {
    const { handle } = setup()
    const response = await handle(
      new Request('https://example.test/functions/v1/admin-users', { method: 'OPTIONS' }),
    )
    expect(response.status).toBe(200)
  })
})
