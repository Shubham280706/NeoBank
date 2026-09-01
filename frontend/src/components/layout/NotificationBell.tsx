import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '../ui/Button'
import { Link } from 'react-router-dom'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    retry: false,
  })
  useRealtimeSync('notifications', [['notifications']])

  const notifications = data?.data ?? []
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-negative)] px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-semibold">Notifications</span>
              <button
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                onClick={async () => {
                  await notificationsApi.markAllRead()
                  queryClient.invalidateQueries({ queryKey: ['notifications'] })
                }}
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-[var(--color-text-muted)]">No notifications yet</p>
              )}
              {notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className={cn('rounded-lg px-2 py-2 text-sm', !n.read && 'bg-[var(--color-surface-2)]')}
                >
                  <p className="font-medium text-[var(--color-text)]">{n.title || 'Notification'}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{n.message}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{formatDateTime(n.created_at)}</p>
                </div>
              ))}
            </div>
            <Link
              to="/notifications"
              className="mt-1 block rounded-lg px-2 py-2 text-center text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface-2)]"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
