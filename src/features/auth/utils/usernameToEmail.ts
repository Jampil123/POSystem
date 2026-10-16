// Supabase Auth logs in with an email, but users only know their username.
// The username is turned into an internal email that users never see or type.
export const LOGIN_EMAIL_DOMAIN = 'kuyatata.local'

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${LOGIN_EMAIL_DOMAIN}`
}
