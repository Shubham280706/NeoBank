import { Menu, Moon, Sun, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '../ui/Button'
import { LiveIndicator } from './LiveIndicator'
import { NotificationBell } from './NotificationBell'
import { initials } from '@/lib/utils'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </Button>
      <div className="flex-1" />
      <LiveIndicator />
      <NotificationBell />
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </Button>
      <div className="hidden items-center gap-2 sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xs font-semibold text-[var(--color-primary)]">
          {initials(fullName)}
        </div>
        <span className="max-w-[120px] truncate text-sm font-medium text-[var(--color-text)]">
          {fullName || profile?.email || 'Account'}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
        <LogOut size={18} />
      </Button>
    </header>
  )
}
