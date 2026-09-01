import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { ShieldCheck } from 'lucide-react'

export default function AdminKyc() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'kyc'],
    queryFn: () => adminApi.kyc({ pageSize: 50 }),
    refetchInterval: 15000,
  })
  const items = data?.data || []

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={28} />} title="No KYC submissions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {items.map((k, i) => (
                  <tr key={k.user_id || i}>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{k.user_id || '—'}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{k.documentType || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusToBadgeVariant(k.status)}>{k.status}</Badge>
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
