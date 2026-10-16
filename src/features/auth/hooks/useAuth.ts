import { useCallback, useContext } from 'react'
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import { getProfile, logOut as logOutRequest } from '@/features/auth/api'
import { AuthContext } from '@/features/auth/authContext'

export const profileQueryKey = (userId: string | undefined) => ['profile', userId] as const

/**
 * - loading: reading the session or the profile
 * - logged-out: no session
 * - active: logged in with an active profile
 * - inactive: logged in, but the account is turned off
 * - error: the profile could not be loaded
 */
export type AuthStatus = 'loading' | 'logged-out' | 'active' | 'inactive' | 'error'

// Current session and logged-in user profile.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')

  const queryClient = useQueryClient()
  const userId = context.session?.user.id

  const profileQuery = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: userId ? () => getProfile(userId) : skipToken,
  })
  const profile = profileQuery.data ?? null

  let status: AuthStatus
  if (context.isSessionLoading) status = 'loading'
  else if (!context.session) status = 'logged-out'
  else if (profileQuery.isError) status = 'error'
  else if (!profile) status = 'loading'
  else status = profile.is_active ? 'active' : 'inactive'

  // Clears all cached data so the next user never sees the previous user's data.
  const logOut = useCallback(async () => {
    await logOutRequest()
    queryClient.clear()
  }, [queryClient])

  return {
    status,
    session: context.session,
    profile,
    refetchProfile: profileQuery.refetch,
    logOut,
  }
}
