import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { kycApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

// Real neo-banks require KYC before letting a newly registered customer use
// the product. Every seeded demo account already has a VERIFIED KYC record
// (see supabase/seed/seed.ts), so this only ever gates brand-new sign-ups.
export function KycGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { session } = useAuth()
  const { data: kyc, isLoading } = useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: kycApi.status,
    enabled: Boolean(session),
    staleTime: 10_000,
  })

  if (location.pathname === '/kyc' || isLoading) return <>{children}</>

  if (kyc?.status !== 'VERIFIED') {
    return <Navigate to="/kyc" replace />
  }

  return <>{children}</>
}
