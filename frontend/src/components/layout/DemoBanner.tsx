import { ShieldAlert } from 'lucide-react'

export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-[var(--color-warning-bg)] px-3 py-1.5 text-center text-xs font-medium text-[var(--color-warning)]">
      <ShieldAlert size={14} className="shrink-0" />
      <span>DEMO BANKING ENVIRONMENT — Simulated data, no real money movement</span>
    </div>
  )
}
