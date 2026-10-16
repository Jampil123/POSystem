import { useEffect, useState, type ReactNode } from 'react'
import { onSessionChange } from '@/features/auth/api'
import { AuthContext, type AuthContextValue } from '@/features/auth/authContext'

// Keeps the current login session for the whole app.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<AuthContextValue>({ session: null, isSessionLoading: true })

  useEffect(() => {
    return onSessionChange((session) => setValue({ session, isSessionLoading: false }))
  }, [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
