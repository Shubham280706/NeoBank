import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'

const ADMIN_TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/kyc', label: 'KYC Queue' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/cards', label: 'Cards' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
  { to: '/admin/system-health', label: 'System Health' },
]

export function AdminLayout() {
  return (
    <div>
      <PageHeader title="Admin" description="Platform-wide monitoring and management" />
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
        {ADMIN_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'shrink-0 border-b-2 px-3 py-2 text-sm font-medium',
                isActive
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
