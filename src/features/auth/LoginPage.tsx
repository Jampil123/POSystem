import { Navigate, useLocation } from 'react-router'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { HOME_PATH } from '@/features/auth/utils/roleAccess'

export type LoginPageState = { message?: string } | null

export default function LoginPage() {
  const { status } = useAuth()
  const location = useLocation()
  const notice = (location.state as LoginPageState)?.message

  // The form stays on screen while logging in, so its error message is not lost.
  if (status === 'active') return <Navigate to={HOME_PATH} replace />

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Card className="w-full max-w-sm gap-6 rounded-lg py-8 shadow-none">
        <CardHeader className="justify-items-center gap-3 text-center">
          <img src="/icons/logo.svg" alt="" className="size-12" />
          <h1 className="text-2xl font-semibold">Kuya Tata POS</h1>
          <p className="text-sm text-muted-foreground">Log in with your username and password.</p>
        </CardHeader>
        <CardContent>
          <LoginForm notice={notice} />
        </CardContent>
      </Card>
    </main>
  )
}
