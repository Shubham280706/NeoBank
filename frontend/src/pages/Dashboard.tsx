import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  accountsApi,
  analyticsApi,
  transactionsApi,
  budgetsApi,
  savingsApi,
  cardsApi,
} from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { VirtualCard } from '@/components/shared/VirtualCard'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const CHART_COLORS = ['#4f46e5', '#1e3a8a', '#16a34a', '#d97706', '#dc2626', '#0ea5e9', '#9333ea']

export default function Dashboard() {
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const overviewQuery = useQuery({ queryKey: ['analytics', 'overview'], queryFn: analyticsApi.overview })
  const categoriesQuery = useQuery({ queryKey: ['analytics', 'categories'], queryFn: analyticsApi.categories })
  const transactionsQuery = useQuery({
    queryKey: ['transactions', { pageSize: 5 }],
    queryFn: () => transactionsApi.list({ pageSize: 5, page: 1 }),
  })
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: budgetsApi.list })
  const savingsQuery = useQuery({ queryKey: ['savings'], queryFn: savingsApi.list })
  const cardsQuery = useQuery({ queryKey: ['cards'], queryFn: cardsApi.list })

  useRealtimeSync('bank_accounts', [['accounts']])
  useRealtimeSync('transactions', [['transactions'], ['analytics', 'overview'], ['analytics', 'categories']])
  useRealtimeSync('budgets', [['budgets']])
  useRealtimeSync('savings_goals', [['savings']])
  useRealtimeSync('cards', [['cards']])

  const accounts = accountsQuery.data || []
  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
  const totalAvailable = accounts.reduce((sum, a) => sum + (a.available_balance ?? a.balance ?? 0), 0)
  const overview = (overviewQuery.data || {}) as Record<string, number | undefined>
  const monthlyIncome = overview.totalIncome ?? 0
  const monthlySpending = overview.totalSpending ?? 0
  const savingsGoals = savingsQuery.data || []
  const totalSavings = savingsGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0)
  const transactions = transactionsQuery.data?.data || []
  const budgets = (budgetsQuery.data || []).slice(0, 4)
  const categories = categoriesQuery.data || []
  const primaryCard = (cardsQuery.data || [])[0]

  const summaryCards = [
    { label: 'Total Balance', value: totalBalance, icon: Wallet, tone: 'primary' },
    { label: 'Available Balance', value: totalAvailable, icon: Wallet, tone: 'accent' },
    { label: 'Monthly Income', value: monthlyIncome, icon: TrendingUp, tone: 'positive' },
    { label: 'Monthly Spending', value: monthlySpending, icon: TrendingDown, tone: 'negative' },
    { label: 'Savings', value: totalSavings, icon: PiggyBank, tone: 'warning' },
  ] as const

  const loadingSummary = accountsQuery.isLoading || overviewQuery.isLoading || savingsQuery.isLoading

  return (
    <div>
      <PageHeader title="Home" description="Your financial snapshot at a glance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loadingSummary
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          : summaryCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">{c.label}</span>
                    <c.icon size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                  <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">{formatCurrency(c.value)}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Link to="/transactions" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {transactionsQuery.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState title="No transactions yet" description="Your recent activity will show up here." />
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-3">
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
                          <p className="text-sm font-medium text-[var(--color-text)]">
                            {t.merchant || t.description || 'Transaction'}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">{formatDate(t.created_at)}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          t.type === 'CREDIT' ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]',
                        )}
                      >
                        {t.type === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(Math.abs(t.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesQuery.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : categories.length === 0 ? (
                <EmptyState title="No spending data" description="Spend using your account to see a breakdown." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categories} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {categories.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {primaryCard ? (
            <VirtualCard card={primaryCard} />
          ) : (
            <EmptyState title="No cards yet" description="Create a card from the Cards page." />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Budgets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budgetsQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : budgets.length === 0 ? (
                <EmptyState title="No budgets set" />
              ) : (
                budgets.map((b) => {
                  const pct = Math.min(100, b.percentUsed ?? (b.spent && b.amount ? (b.spent / b.amount) * 100 : 0))
                  const danger = pct >= 100
                  const warn = pct >= 70
                  return (
                    <div key={b.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--color-text)]">{b.category}</span>
                        <span className="text-[var(--color-text-muted)]">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            danger ? 'bg-[var(--color-negative)]' : warn ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-positive)]',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Savings Goals</CardTitle>
              <Link to="/savings" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {savingsQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : savingsGoals.length === 0 ? (
                <EmptyState title="No savings goals" />
              ) : (
                savingsGoals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, ((g.current_amount || 0) / (g.target_amount || 1)) * 100)
                  return (
                    <div key={g.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--color-text)]">{g.name}</span>
                        <Badge variant="accent">{Math.round(pct)}%</Badge>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                        <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {formatCurrency(g.current_amount || 0)} of {formatCurrency(g.target_amount)}
                      </p>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
