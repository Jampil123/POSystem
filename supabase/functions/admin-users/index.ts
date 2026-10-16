// admin-users Edge Function: add users, edit them, turn them off or on, and
// reset passwords and approval PINs. Only a logged-in, active admin can use it.
//
// It uses the service role key that Supabase gives every Edge Function
// (SUPABASE_SERVICE_ROLE_KEY). That key never leaves the server: it is not in
// the app or in the app's .env.
//
// Deploy: npx supabase functions deploy admin-users

import { createClient } from 'npm:@supabase/supabase-js@2'
import { createAdminUsersHandler } from './handler.ts'

function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Blocking a login for 100 years; 'none' removes the block.
const BLOCKED_FOR = '876000h'

const handler = createAdminUsersHandler({
  async getUserIdFromToken(token) {
    const { data, error } = await supabase.auth.getUser(token)
    return error ? null : (data.user?.id ?? null)
  },

  async getAccount(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async countActiveAdmins() {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true)
    if (error) throw error
    return count ?? 0
  },

  async usernameExists(username) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()
    if (error) throw error
    return data !== null
  },

  async createUser({ email, password, username, fullName, role }) {
    // The handle_new_user trigger creates the profile (as a cashier) from this metadata.
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: fullName },
    })
    if (error) throw error
    if (role === 'admin') {
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', data.user.id)
      if (roleError) throw roleError
    }
    return data.user.id
  },

  async updateProfile(userId, { fullName, role, isActive }) {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, role, is_active: isActive })
      .eq('id', userId)
    if (error) throw error
  },

  async setLoginBlocked(userId, blocked) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: blocked ? BLOCKED_FOR : 'none',
    })
    if (error) throw error
  },

  async setPassword(userId, password) {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password })
    if (error) throw error
  },

  async clearApprovalPin(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ approval_pin_hash: null, pin_failed_attempts: 0, pin_locked_until: null })
      .eq('id', userId)
    if (error) throw error
  },
})

Deno.serve(handler)
