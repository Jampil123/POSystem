import { FunctionsHttpError } from '@supabase/supabase-js'
import type { AdminUserRequest } from '@functions/_shared/userRules.ts'
import type { Profile } from '@/features/auth/types'
import { supabase } from '@/lib/supabase'

export type UserListItem = Profile

export async function listUsers(): Promise<UserListItem[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, role, is_active, created_at, updated_at')
    .order('full_name')
  if (error) throw new Error('Could not load the users.')
  return data
}

// Adding users, turning them off, and resetting passwords need the service
// role key, which only the admin-users Edge Function has. The function checks
// that the caller is an active admin.
async function callAdminUsers(request: AdminUserRequest): Promise<void> {
  const { error } = await supabase.functions.invoke('admin-users', { body: request })
  if (!error) return

  if (error instanceof FunctionsHttpError) {
    const body: unknown = await error.context.json().catch(() => null)
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
    ) {
      throw new Error(body.error)
    }
    throw new Error('The request was not accepted. Please try again.')
  }
  throw new Error(
    'Could not reach the user service. Check the internet connection, or ask the team to deploy the admin-users function.',
  )
}

export function createUser(values: {
  fullName: string
  username: string
  password: string
  role: Profile['role']
}) {
  return callAdminUsers({ action: 'create', ...values })
}

export function updateUser(
  userId: string,
  values: { fullName: string; role: Profile['role']; isActive: boolean },
) {
  return callAdminUsers({ action: 'update', userId, ...values })
}

export function resetPassword(userId: string, password: string) {
  return callAdminUsers({ action: 'reset-password', userId, password })
}

/** Removes an admin's approval PIN; they set a new one from their user menu. */
export function resetApprovalPin(userId: string) {
  return callAdminUsers({ action: 'reset-pin', userId })
}
