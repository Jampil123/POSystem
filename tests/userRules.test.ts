import {
  checkCaller,
  checkUserChange,
  parseAdminUserRequest,
  removesAdminAccess,
  type AccountSummary,
} from '@functions/_shared/userRules.ts'

const owner: AccountSummary = { id: 'owner', role: 'admin', is_active: true }
const partner: AccountSummary = { id: 'partner', role: 'admin', is_active: true }
const juan: AccountSummary = { id: 'juan', role: 'cashier', is_active: true }

describe('checkUserChange (safety rules)', () => {
  it('blocks an admin from deactivating their own account', () => {
    expect(
      checkUserChange({
        actorId: 'owner',
        target: owner,
        change: { isActive: false },
        activeAdminCount: 2,
      }),
    ).toBe('You cannot deactivate or demote your own account.')
  })

  it('blocks an admin from demoting their own account', () => {
    expect(
      checkUserChange({
        actorId: 'owner',
        target: owner,
        change: { role: 'cashier' },
        activeAdminCount: 2,
      }),
    ).toBe('You cannot deactivate or demote your own account.')
  })

  it('blocks removing the last active admin', () => {
    expect(
      checkUserChange({
        actorId: 'someone',
        target: owner,
        change: { isActive: false },
        activeAdminCount: 1,
      }),
    ).toBe('This is the last active admin. Make another user an admin first.')
    expect(
      checkUserChange({
        actorId: 'someone',
        target: owner,
        change: { role: 'cashier' },
        activeAdminCount: 1,
      }),
    ).toBe('This is the last active admin. Make another user an admin first.')
  })

  it('allows deactivating another admin when one more admin stays active', () => {
    expect(
      checkUserChange({
        actorId: 'owner',
        target: partner,
        change: { isActive: false },
        activeAdminCount: 2,
      }),
    ).toBeNull()
  })

  it('allows any change to a cashier', () => {
    expect(
      checkUserChange({
        actorId: 'owner',
        target: juan,
        change: { isActive: false },
        activeAdminCount: 1,
      }),
    ).toBeNull()
    expect(
      checkUserChange({
        actorId: 'owner',
        target: juan,
        change: { role: 'admin' },
        activeAdminCount: 1,
      }),
    ).toBeNull()
  })

  it('allows an admin to edit their own name (no role or status change)', () => {
    expect(
      checkUserChange({
        actorId: 'owner',
        target: owner,
        change: { role: 'admin', isActive: true },
        activeAdminCount: 1,
      }),
    ).toBeNull()
  })
})

describe('removesAdminAccess', () => {
  it('is false for an admin who is already inactive', () => {
    expect(removesAdminAccess({ ...owner, is_active: false }, { role: 'cashier' })).toBe(false)
  })
})

describe('checkCaller', () => {
  it('lets an active admin manage users', () => {
    expect(checkCaller(owner)).toBeNull()
  })

  it('rejects cashiers, inactive admins, and unknown callers', () => {
    expect(checkCaller(juan)).toBe('Only an admin can manage users.')
    expect(checkCaller({ ...owner, is_active: false })).toBe('This account is turned off.')
    expect(checkCaller(null)).toBe('Log in first.')
  })
})

describe('parseAdminUserRequest', () => {
  it('accepts a new user and lowercases the username', () => {
    expect(
      parseAdminUserRequest({
        action: 'create',
        fullName: ' Juan Dela Cruz ',
        username: ' Juan ',
        password: 'secret123',
        role: 'cashier',
      }),
    ).toEqual({
      ok: true,
      request: {
        action: 'create',
        fullName: 'Juan Dela Cruz',
        username: 'juan',
        password: 'secret123',
        role: 'cashier',
      },
    })
  })

  it('requires a password of at least 8 characters', () => {
    const result = parseAdminUserRequest({
      action: 'create',
      fullName: 'Juan',
      username: 'juan',
      password: 'short',
      role: 'cashier',
    })
    expect(result).toEqual({ ok: false, error: 'The password must be at least 8 characters.' })
  })

  it('rejects usernames with spaces or symbols', () => {
    const result = parseAdminUserRequest({
      action: 'create',
      fullName: 'Juan',
      username: 'juan dela cruz',
      password: 'secret123',
      role: 'cashier',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects unknown actions and missing users', () => {
    expect(parseAdminUserRequest({ action: 'delete', userId: 'x' }).ok).toBe(false)
    expect(parseAdminUserRequest({ action: 'reset-pin' }).ok).toBe(false)
    expect(parseAdminUserRequest(null).ok).toBe(false)
  })
})
