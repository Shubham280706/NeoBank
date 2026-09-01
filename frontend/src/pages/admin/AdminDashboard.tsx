import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'
import { Users, Receipt, ShieldCheck, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminApi.analytics,
    refetchInterval: 15000,
  })

  const stats = (data || {}) as Record<string, number | undefined>

  const cards = [
    { label: 'Total Users', value: stats.totalUsers ?? stats.total_users ?? 0, icon: Users, format: (v: number) => v.toLocaleString() },
    { label: 'Total Transactions', value: stats.totalTransactions ?? stats.total_transactions ?? 0, icon: Receipt, format: (v: number) => v.toLocaleString() },
    { label: 'Transaction Volume', value: stats.totalTransactionVolume ?? 0, icon: Activity, format: (v: number) => formatCurrency(v) },
    { label: 'Pending KYC', value: stats.pendingKyc ?? stats.pending_kyc ?? 0, icon: ShieldCheck, format: (v: number) => v.toLocaleString() },
  ] as const

  return (
    <div>
      <div className="mb-2 text-xs text-[var(--color-text-muted)]">
        Data refreshes automatically every 15 seconds.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          : cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">{c.label}</span>
                    <c.icon size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                  <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">{c.format(c.value)}</p>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  )
}
