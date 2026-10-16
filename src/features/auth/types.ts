import type { Enums, Tables } from '@/types/database'

// The approval PIN columns of profiles are never sent to the app.
export type Profile = Pick<
  Tables<'profiles'>,
  'id' | 'full_name' | 'username' | 'role' | 'is_active' | 'created_at' | 'updated_at'
>
export type Role = Enums<'user_role'>
