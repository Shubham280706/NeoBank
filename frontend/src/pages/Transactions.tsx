import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionsApi, type TransactionFilters } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10
const CATEGORIES = [
  'Entertainment',
  'Subscriptions',
  'Dining',
  'Shopping',
  'Travel',
  'Utilities',
  'Groceries',
  'Transfer',
  'General',
]

export default function Transactions() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, pageSize: PAGE_SIZE })

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.list(filters),
  })
  useRealtimeSync('transactions', [['transactions']])

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) => transactionsApi.updateCategory(id, category),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      toast({ title: 'Category updated', description: `Categorized as ${variables.category}`, variant: 'success' })
    },
    onError: (err) => toast({ title: 'Could not update category', description: (err as Error).message, variant: 'error' }),
  })

  const transactions = data?.data || []
  const total = data?.total ?? transactions.length
  const page = filters.page || 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const update = (patch: Partial<TransactionFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }))

  return (
    <div>
      <PageHeader title="Transactions" description="Search and filter your transaction history" />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <Input
            placeholder="Search merchant, remarks..."
            className="lg:col-span-2"
            value={filters.search || ''}
            onChange={(e) => update({ search: e.target.value })}
          />
          <Select value={filters.type || ''} onChange={(e) => update({ type: e.target.value || undefined })}>
            <option value="">All types</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </Select>
          <Select value={filters.status || ''} onChange={(e) => update({ status: e.target.value || undefined })}>
            <option value="">All statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </Select>
          <Input type="date" value={filters.dateFrom || ''} onChange={(e) => update({ dateFrom: e.target.value || undefined })} />
          <Input type="date" value={filters.dateTo || ''} onChange={(e) => update({ dateTo: e.target.value || undefined })} />
          <Input
            placeholder="Category"
            className="lg:col-span-1"
            value={filters.category || ''}
            onChange={(e) => update({ category: e.target.value || undefined })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState icon={<Receipt size={32} />} title="No transactions found" description="Try adjusting your filters." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3 font-medium text-[var(--color-text)]">{t.merchant || t.description || 'Transaction'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">
                          <Select
                            className="h-8 text-xs py-0"
                            value={t.category || 'General'}
                            onChange={(e) => updateCategoryMutation.mutate({ id: t.id, category: e.target.value })}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDateTime(t.created_at)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusToBadgeVariant(t.status)}>{t.status || 'success'}</Badge>
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-semibold',
                            t.type === 'CREDIT' ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]',
                          )}
                        >
                          {t.type === 'CREDIT' ? '+' : '-'}
                          {formatCurrency(Math.abs(t.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[var(--color-border)] md:hidden">
                {transactions.map((t) => (
                  <div key={t.id} className="flex flex-col gap-2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full',
                            t.type === 'CREDIT' ? 'bg-[var(--color-positive-bg)]' : 'bg-[var(--color-negative-bg)]',
                          )}
                        >
                          {t.type === 'CREDIT' ? (
                            <ArrowDownRight size={16} className="text-[var(--color-positive)]" />
                          ) : (
                            <ArrowUpRight size={16} className="text-[var(--color-negative)]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text)]">{t.merchant || t.description || 'Transaction'}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{formatDateTime(t.created_at)}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-sm font-semibold',
                          t.type === 'CREDIT' ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]',
                        )}
                      >
                        {t.type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(Math.abs(t.amount))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Badge variant={statusToBadgeVariant(t.status)}>
                        {t.status || 'success'}
                      </Badge>
                      <Select
                        className="h-7 text-[11px] py-0 w-36"
                        value={t.category || 'General'}
                        onChange={(e) => updateCategoryMutation.mutate({ id: t.id, category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}
                  >
                    <ChevronLeft size={14} /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
