import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, formatDateTime } from '@/lib/utils'
import { Bell, Check } from 'lucide-react'

export default function Notifications() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list })
  useRealtimeSync('notifications', [['notifications']])
  const notifications = data?.data ?? []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay up to date with your account activity"
        actions={
          <Button
            variant="outline"
            onClick={async () => {
              await notificationsApi.markAllRead()
              invalidate()
            }}
          >
            <Check size={16} /> Mark all read
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading…</p>
          ) : notifications.length === 0 ? (
            <EmptyState icon={<Bell size={32} />} title="No notifications" />
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {notifications.map((n) => (
                <div key={n.id} className={cn('flex items-start justify-between gap-3 p-4', !n.read && 'bg-[var(--color-surface-2)]')}>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{n.title || 'Notification'}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{n.message}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDateTime(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await notificationsApi.markRead(n.id)
                        invalidate()
                      }}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
