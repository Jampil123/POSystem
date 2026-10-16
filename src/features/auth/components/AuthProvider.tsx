import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { onSessionChange, takeLogoutRequested } from '@/features/auth/api'
import { AuthContext, type AuthContextValue } from '@/features/auth/authContext'

// Keeps the current login session for the whole app.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AuthContextValue>({
    session: null,
    isSessionLoading: true,
    sessionEnded: false,
  })
  const previousSession = useRef<Session | null>(null)

  useEffect(() => {
    return onSessionChange((session) => {
      // A session that disappears without "Log out" has expired or was ended.
      const endedByItself =
        previousSession.current !== null && session === null && !takeLogoutRequested()
      previousSession.current = session
      setValue({ session, isSessionLoading: false, sessionEnded: endedByItself })
    })
  }, [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
