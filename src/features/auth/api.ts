import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/features/auth/types'
import { usernameToEmail } from '@/features/auth/utils/usernameToEmail'
import { supabase } from '@/lib/supabase'

export const WRONG_CREDENTIALS_MESSAGE = 'Wrong username or password.'
export const INACTIVE_ACCOUNT_MESSAGE =
  'This account is turned off. Please ask the store owner to turn it back on.'

// Logs in with a username. Inactive accounts are logged out right away.
export async function logIn(username: string, password: string): Promise<Profile> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  })

  if (error) {
    // invalid_credentials covers both an unknown username and a wrong password.
    if (error.code === 'invalid_credentials') throw new Error(WRONG_CREDENTIALS_MESSAGE)
    if (error.code === 'email_not_confirmed') {
      throw new Error('This account is not set up yet. Please ask the store owner.')
    }
    throw new Error('Could not log in. Check the internet connection and try again.')
  }

  const profile = await getProfile(data.user.id)
  if (!profile.is_active) {
    await supabase.auth.signOut()
    throw new Error(INACTIVE_ACCOUNT_MESSAGE)
  }

  return profile
}

export async function logOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error('Could not log out. Please try again.')
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw new Error('Could not load your account.')
  return data
}

// Calls onChange with the current session right away, then on every login and logout.
// Returns a function that stops listening.
export function onSessionChange(onChange: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session))
  return () => data.subscription.unsubscribe()
}
