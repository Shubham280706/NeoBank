import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MOBILE_NAV_ITEMS } from './navConfig'

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 py-1.5 backdrop-blur md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium',
              isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
            )
          }
        >
          <item.icon size={20} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
