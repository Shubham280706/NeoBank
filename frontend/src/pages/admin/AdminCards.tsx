import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { CreditCard } from 'lucide-react'

export default function AdminCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'cards'],
    queryFn: () => adminApi.cards({ pageSize: 50 }),
    refetchInterval: 15000,
  })
  const cards = data?.data || []

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : cards.length === 0 ? (
          <EmptyState icon={<CreditCard size={28} />} title="No cards found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-medium">Card</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {cards.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-text)]">
                      {`•••• ${c.last4 || '0000'}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusToBadgeVariant(c.status)}>{c.status || 'ACTIVE'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">
                      {c.spending_limit != null ? formatCurrency(c.spending_limit) : '—'}
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
