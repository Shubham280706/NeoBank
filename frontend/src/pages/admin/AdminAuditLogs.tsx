import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDateTime } from '@/lib/utils'
import { FileClock } from 'lucide-react'

export default function AdminAuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => adminApi.auditLogs({ pageSize: 50 }),
  })
  const logs = data?.data || []

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : logs.length === 0 ? (
          <EmptyState icon={<FileClock size={28} />} title="No audit logs" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {logs.map((log, i) => {
              const l = log as Record<string, unknown>
              return (
                <div key={(l.id as string) || i} className="p-4 text-sm">
                  <p className="font-medium text-[var(--color-text)]">{String(l.action || l.event || 'Action')}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {l.actor ? `By ${l.actor} · ` : ''}
                    {l.created_at ? formatDateTime(l.created_at as string) : ''}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
