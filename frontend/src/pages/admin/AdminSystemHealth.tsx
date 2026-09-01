import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { Activity } from 'lucide-react'

export default function AdminSystemHealth() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: adminApi.systemHealth,
    refetchInterval: 15000,
  })

  const health = (data || {}) as Record<string, unknown>
  const entries = Object.entries(health)

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Activity size={18} />
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No health data available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-4 py-3">
                <span className="text-sm capitalize text-[var(--color-text)]">{key.replace(/_/g, ' ')}</span>
                {typeof value === 'string' ? (
                  <Badge variant={statusToBadgeVariant(value)}>{value}</Badge>
                ) : (
                  <span className="text-sm font-medium text-[var(--color-text)]">{String(value)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
