// Rules for user accounts, shared by the app (Users page) and the admin-users
// Edge Function, so both check exactly the same things.
// Plain TypeScript only: no Deno or browser APIs, so Vitest can test it.

// ---------------------------------------------------------------------------
// Usernames (users log in with a username; Supabase Auth needs an email)
// ---------------------------------------------------------------------------

export const LOGIN_EMAIL_DOMAIN = 'kuyatata.local'
/** Same rule as the profiles.username check in the database. */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/
export const MIN_PASSWORD_LENGTH = 8

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${LOGIN_EMAIL_DOMAIN}`
}

// ---------------------------------------------------------------------------
// Who may manage users
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'cashier'

export type AccountSummary = {
  id: string
  role: UserRole
  is_active: boolean
}

/** Null when the caller may manage users; otherwise why not. */
export function checkCaller(caller: AccountSummary | null): string | null {
  if (!caller) return 'Log in first.'
  if (!caller.is_active) return 'This account is turned off.'
  if (caller.role !== 'admin') return 'Only an admin can manage users.'
  return null
}

// ---------------------------------------------------------------------------
// Safety rules for changing a user
// ---------------------------------------------------------------------------

export type UserChange = {
  role?: UserRole
  isActive?: boolean
}

type ChangeCheck = {
  /** The admin making the change. */
  actorId: string
  target: AccountSummary
  change: UserChange
  /** Active admins right now, including the target if it is one. */
  activeAdminCount: number
}

/** True when the change takes admin access away from an active admin. */
export function removesAdminAccess(target: AccountSummary, change: UserChange): boolean {
  if (target.role !== 'admin' || !target.is_active) return false
  const demoted = change.role !== undefined && change.role !== 'admin'
  const deactivated = change.isActive === false
  return demoted || deactivated
}

/**
 * Null when the change is allowed; otherwise why not.
 * - An admin cannot deactivate or demote their own account.
 * - The last active admin cannot be deactivated or demoted.
 */
export function checkUserChange({
  actorId,
  target,
  change,
  activeAdminCount,
}: ChangeCheck): string | null {
  if (!removesAdminAccess(target, change)) return null
  if (target.id === actorId) return 'You cannot deactivate or demote your own account.'
  if (activeAdminCount <= 1) {
    return 'This is the last active admin. Make another user an admin first.'
  }
  return null
}

// ---------------------------------------------------------------------------
// Requests to the admin-users Edge Function
// ---------------------------------------------------------------------------

export type AdminUserRequest =
  | { action: 'create'; fullName: string; username: string; password: string; role: UserRole }
  | { action: 'update'; userId: string; fullName: string; role: UserRole; isActive: boolean }
  | { action: 'reset-password'; userId: string; password: string }
  | { action: 'reset-pin'; userId: string }

type Parsed = { ok: true; request: AdminUserRequest } | { ok: false; error: string }

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'cashier'
}

function checkFullName(fullName: string): string | null {
  if (!fullName) return 'Enter the full name.'
  if (fullName.length > 100) return 'Keep the name under 100 characters.'
  return null
}

function checkPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password.length > 72) return 'Keep the password under 72 characters.'
  return null
}

/** Checks the body sent to the Edge Function. */
export function parseAdminUserRequest(body: unknown): Parsed {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Invalid request.' }
  const input = body as Record<string, unknown>
  const userId = text(input.userId)

  switch (input.action) {
    case 'create': {
      const fullName = text(input.fullName)
      const username = normalizeUsername(text(input.username))
      const error =
        checkFullName(fullName) ??
        (USERNAME_PATTERN.test(username)
          ? null
          : 'Usernames have 3 to 30 letters, numbers, dots, dashes, or underscores.') ??
        checkPassword(input.password) ??
        (isRole(input.role) ? null : 'Choose a role.')
      if (error) return { ok: false, error }
      return {
        ok: true,
        request: {
          action: 'create',
          fullName,
          username,
          password: input.password as string,
          role: input.role as UserRole,
        },
      }
    }
    case 'update': {
      const fullName = text(input.fullName)
      const error =
        (userId ? null : 'Choose a user.') ??
        checkFullName(fullName) ??
        (isRole(input.role) ? null : 'Choose a role.') ??
        (typeof input.isActive === 'boolean' ? null : 'Invalid request.')
      if (error) return { ok: false, error }
      return {
        ok: true,
        request: {
          action: 'update',
          userId,
          fullName,
          role: input.role as UserRole,
          isActive: input.isActive as boolean,
        },
      }
    }
    case 'reset-password': {
      const error = (userId ? null : 'Choose a user.') ?? checkPassword(input.password)
      if (error) return { ok: false, error }
      return {
        ok: true,
        request: { action: 'reset-password', userId, password: input.password as string },
      }
    }
    case 'reset-pin':
      if (!userId) return { ok: false, error: 'Choose a user.' }
      return { ok: true, request: { action: 'reset-pin', userId } }
    default:
      return { ok: false, error: 'Unknown action.' }
  }
}
