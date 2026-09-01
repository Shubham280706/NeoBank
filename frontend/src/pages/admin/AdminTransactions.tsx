import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { Receipt } from 'lucide-react'

// NOTE: Regular Supabase Realtime subscriptions are scoped by RLS to the
// signed-in user's own rows, so an admin client would not receive postgres_changes
// events for other users' transactions unless dedicated admin RLS policies grant
// that access. As a pragmatic fallback we poll the admin endpoint on an interval
// instead of relying on realtime here.
export default function AdminTransactions() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: () => adminApi.transactions({ pageSize: 50 }),
    refetchInterval: 15000,
  })
  const transactions = data?.data || []

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : transactions.length === 0 ? (
          <EmptyState icon={<Receipt size={28} />} title="No transactions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{t.merchant || t.description || 'Transaction'}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDateTime(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusToBadgeVariant(t.status)}>{t.status || 'success'}</Badge>
                    </td>
                    <td className={cn('px-4 py-3 text-right font-semibold', t.type === 'CREDIT' ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]')}>
                      {t.type === 'CREDIT' ? '+' : '-'}
                      {formatCurrency(Math.abs(t.amount))}
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
