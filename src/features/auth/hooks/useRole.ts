import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Role } from '@/features/auth/types'

// Role of the logged-in user (null while loading or logged out).
export function useRole(): { role: Role | null; isAdmin: boolean } {
  const { profile } = useAuth()
  const role = profile?.role ?? null
  return { role, isAdmin: role === 'admin' }
}
