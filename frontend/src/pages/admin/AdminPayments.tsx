import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Wallet } from 'lucide-react'

export default function AdminPayments() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => adminApi.payments({ pageSize: 50 }),
    refetchInterval: 15000,
  })
  const payments = data?.data || []

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : payments.length === 0 ? (
          <EmptyState icon={<Wallet size={28} />} title="No payments found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{p.id}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.paymentMethod || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusToBadgeVariant(p.status)}>{p.status || 'pending'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-text)]">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
