import { Outlet } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { DemoBanner } from '@/components/layout/DemoBanner'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <DemoBanner />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
              <Landmark size={24} />
            </div>
            <span className="text-xl font-semibold text-[var(--color-text)]">NeoBank</span>
            <p className="text-sm text-[var(--color-text-muted)]">Simulated Indian neo-banking demo</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
