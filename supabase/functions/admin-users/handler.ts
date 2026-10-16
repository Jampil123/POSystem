// Request handling for the admin-users Edge Function.
// The database and Auth calls are passed in (see index.ts), so this file has
// no Deno or Supabase imports and can be tested with Vitest (tests/adminUsersHandler.test.ts).

import {
  checkCaller,
  checkUserChange,
  parseAdminUserRequest,
  usernameToEmail,
  type AccountSummary,
  type AdminUserRequest,
  type UserRole,
} from '../_shared/userRules.ts'

export type AdminUsersDeps = {
  /** The user id of a valid login token, or null. */
  getUserIdFromToken: (token: string) => Promise<string | null>
  getAccount: (userId: string) => Promise<AccountSummary | null>
  countActiveAdmins: () => Promise<number>
  usernameExists: (username: string) => Promise<boolean>
  /** Creates the login and its profile; returns the new user's id. */
  createUser: (input: {
    email: string
    password: string
    username: string
    fullName: string
    role: UserRole
  }) => Promise<string>
  updateProfile: (
    userId: string,
    changes: { fullName: string; role: UserRole; isActive: boolean },
  ) => Promise<void>
  /** Blocks or unblocks logging in at the Auth level. */
  setLoginBlocked: (userId: string, blocked: boolean) => Promise<void>
  setPassword: (userId: string, password: string) => Promise<void>
  clearApprovalPin: (userId: string) => Promise<void>
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function createAdminUsersHandler(deps: AdminUsersDeps) {
  return async function handle(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

    try {
      // 1. Only a logged-in, active admin may continue.
      const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
      const callerId = token ? await deps.getUserIdFromToken(token) : null
      if (!callerId) return json({ error: 'Log in first.' }, 401)

      const callerError = checkCaller(await deps.getAccount(callerId))
      if (callerError) return json({ error: callerError }, 403)

      // 2. Check the request.
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return json({ error: 'Invalid request.' }, 400)
      }
      const parsed = parseAdminUserRequest(body)
      if (!parsed.ok) return json({ error: parsed.error }, 400)

      // 3. Do it.
      return await run(parsed.request, callerId, deps)
    } catch {
      return json({ error: 'Something went wrong. Please try again.' }, 500)
    }
  }
}

async function run(request: AdminUserRequest, callerId: string, deps: AdminUsersDeps) {
  if (request.action === 'create') {
    if (await deps.usernameExists(request.username)) {
      return json({ error: 'This username is already taken.' }, 409)
    }
    const userId = await deps.createUser({
      email: usernameToEmail(request.username),
      password: request.password,
      username: request.username,
      fullName: request.fullName,
      role: request.role,
    })
    return json({ ok: true, userId }, 200)
  }

  const target = await deps.getAccount(request.userId)
  if (!target) return json({ error: 'User not found.' }, 404)

  switch (request.action) {
    case 'update': {
      const error = checkUserChange({
        actorId: callerId,
        target,
        change: { role: request.role, isActive: request.isActive },
        activeAdminCount: await deps.countActiveAdmins(),
      })
      if (error) return json({ error }, 400)

      await deps.updateProfile(request.userId, {
        fullName: request.fullName,
        role: request.role,
        isActive: request.isActive,
      })
      // A turned-off account also cannot log in or refresh its session.
      if (target.is_active !== request.isActive) {
        await deps.setLoginBlocked(request.userId, !request.isActive)
      }
      return json({ ok: true }, 200)
    }
    case 'reset-password':
      await deps.setPassword(request.userId, request.password)
      return json({ ok: true }, 200)
    case 'reset-pin':
      await deps.clearApprovalPin(request.userId)
      return json({ ok: true }, 200)
  }
}
