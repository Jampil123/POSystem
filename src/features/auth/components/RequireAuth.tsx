import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { Button } from '@/components/ui/button'
import { INACTIVE_ACCOUNT_MESSAGE } from '@/features/auth/api'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { LoginPageState } from '@/features/auth/LoginPage'
import { canAccessPath, HOME_PATH } from '@/features/auth/utils/roleAccess'

// Route guard for every page except /login:
// - logged-out users go to /login
// - turned-off accounts are logged out
// - cashiers who open an admin-only page go to /pos
export function RequireAuth() {
  const { status, profile, logOut, refetchProfile } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    if (status === 'inactive') void logOut().catch(() => undefined)
  }, [status, logOut])

  if (status === 'loading') return <LoadingScreen />

  if (status === 'logged-out') return <Navigate to="/login" replace />

  if (status === 'inactive') {
    const state: LoginPageState = { message: INACTIVE_ACCOUNT_MESSAGE }
    return <Navigate to="/login" replace state={state} />
  }

  if (status === 'error' || !profile) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-4 text-center">
        <p role="alert" className="text-destructive">
          Could not load your account. Check the internet connection.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button className="h-12 px-6" onClick={() => void refetchProfile()}>
            Try again
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6"
            onClick={() => void logOut().catch((error: Error) => toast.error(error.message))}
          >
            Log out
          </Button>
        </div>
      </div>
    )
  }

  if (!canAccessPath(profile.role, pathname)) return <Navigate to={HOME_PATH} replace />

  return <Outlet />
}
