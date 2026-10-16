// Supabase Auth logs in with an email, but users only know their username.
// The username is turned into an internal email that users never see or type.
// The rule lives in the shared user rules so the admin-users Edge Function uses the same one.
export {
  LOGIN_EMAIL_DOMAIN,
  normalizeUsername,
  usernameToEmail,
} from '@functions/_shared/userRules.ts'
