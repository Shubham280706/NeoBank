import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, maskAccountNumber } from '@/lib/utils'
import { Wallet } from 'lucide-react'

export default function Accounts() {
  const { data, isLoading } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  useRealtimeSync('bank_accounts', [['accounts']])

  const accounts = data || []

  return (
    <div>
      <PageHeader title="Accounts" description="All your simulated bank accounts" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState icon={<Wallet size={32} />} title="No accounts found" description="Your linked accounts will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="accent">{a.type || 'Savings'}</Badge>
                  {a.currency && <span className="text-xs text-[var(--color-text-muted)]">{a.currency}</span>}
                </div>
                <p className="mt-4 text-2xl font-semibold text-[var(--color-text)]">{formatCurrency(a.balance)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Available: {formatCurrency(a.available_balance ?? a.balance)}
                </p>
                <div className="mt-4 border-t border-[var(--color-border)] pt-3 text-sm">
                  <p className="font-mono text-[var(--color-text)]">{maskAccountNumber(a.account_number)}</p>
                  {a.ifsc && <p className="text-xs text-[var(--color-text-muted)]">IFSC: {a.ifsc}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
