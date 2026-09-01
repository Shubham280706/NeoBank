import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { MOBILE_NAV_ITEMS } from './navConfig'

export function BottomNav() {
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 px-3 md:hidden pointer-events-none">
      <nav className="pointer-events-auto mx-auto flex max-w-md items-center justify-around rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 py-2 shadow-2xl backdrop-blur-xl">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium transition-all duration-200',
                isActive
                  ? 'text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                    isActive
                      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-sm'
                      : 'bg-transparent',
                  )}
                >
                  <item.icon size={18} />
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
