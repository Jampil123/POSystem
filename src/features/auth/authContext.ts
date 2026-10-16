import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthContextValue = {
  session: Session | null
  /** True until the saved session (if any) has been read on app start. */
  isSessionLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
