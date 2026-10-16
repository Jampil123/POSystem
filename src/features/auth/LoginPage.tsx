import { Navigate, useLocation } from 'react-router'
import { LoginBrandPanel } from '@/features/auth/components/LoginBrandPanel'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { HOME_PATH } from '@/features/auth/utils/roleAccess'

export type LoginPageState = { message?: string } | null

// UI guide 6.1: the store's yellow brand panel next to the login form.
// Tablets and computers: two columns. Phones: the brand panel sits above the form.
export default function LoginPage() {
  const { status } = useAuth()
  const location = useLocation()
  const notice = (location.state as LoginPageState)?.message

  // The form stays on screen while logging in, so its error message is not lost.
  if (status === 'active') return <Navigate to={HOME_PATH} replace />

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">
      <div className="grid w-full max-w-md overflow-hidden rounded-xl border bg-card md:max-w-5xl md:grid-cols-2 md:min-h-[36rem] short:min-h-0!">
        <LoginBrandPanel />

        <div className="flex flex-col justify-center gap-6 p-6 md:p-10 short:gap-4! short:py-5!">
          <div className="grid gap-1">
            <h1 className="text-2xl font-semibold">Log in</h1>
            <p className="text-sm text-muted-foreground">
              Use the username and password the store owner gave you.
            </p>
          </div>

          <LoginForm notice={notice} />

          <p className="text-center text-xs text-muted-foreground">
            For Kuya Tata staff only. No account yet? Ask the store owner.
          </p>
        </div>
      </div>
    </main>
  )
}
