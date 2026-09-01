import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { authApi, type Profile, type BankAccount } from '@/lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  profile?: Profile
  bankAccounts: BankAccount[]
  isAdmin: boolean
  configured: boolean
  refetchProfile: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      queryClient.invalidateQueries()
    })
    return () => sub.subscription.unsubscribe()
  }, [queryClient])

  const meQuery = useQuery({
    queryKey: ['auth', 'me', session?.user.id],
    queryFn: authApi.me,
    enabled: Boolean(session),
    staleTime: 30_000,
  })

  const value: AuthContextValue = {
    session,
    loading,
    // /api/auth/me returns profile fields spread at the top level alongside
    // bank_accounts (not nested under a `profile` key) — see authService.ts.
    profile: meQuery.data as Profile | undefined,
    bankAccounts: meQuery.data?.bank_accounts || [],
    isAdmin: meQuery.data?.role === 'admin',
    configured: isSupabaseConfigured,
    refetchProfile: () => meQuery.refetch(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
