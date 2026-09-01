import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { KycGate } from '@/layouts/KycGate'
import { useMoneyReceivedListener } from '@/hooks/useMoneyReceivedListener'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Listen for real-time incoming money transfers & notifications globally
  useMoneyReceivedListener()

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">
          <div className="mx-auto w-full max-w-7xl">
            <KycGate>
              <Outlet />
            </KycGate>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
