import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  Building2,
  Eye,
  EyeOff,
  CreditCard,
  BarChart3,
} from 'lucide-react'
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
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Label } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { VirtualCard } from '@/components/shared/VirtualCard'
import { formatCurrency, formatDate, maskAccountNumber, cn } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const CHART_COLORS = ['#4f46e5', '#1e3a8a', '#16a34a', '#d97706', '#dc2626', '#0ea5e9', '#9333ea']

export default function Dashboard() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [openDepositModal, setOpenDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem('show_balance') === 'true')

  const toggleShowBalance = () => {
    setShowBalance((prev) => {
      const next = !prev
      localStorage.setItem('show_balance', String(next))
      return next
    })
  }

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
  const primaryAccount = accounts[0]
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

  const depositMutation = useMutation({
    mutationFn: () => accountsApi.deposit(primaryAccount!.id, Number(depositAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] })
      toast({ title: 'Money added', description: `Successfully added ${formatCurrency(Number(depositAmount))}.`, variant: 'success' })
      setOpenDepositModal(false)
      setDepositAmount('')
    },
    onError: (err) => toast({ title: 'Could not add money', description: (err as Error).message, variant: 'error' }),
  })

  const loadingSummary = accountsQuery.isLoading || overviewQuery.isLoading || savingsQuery.isLoading

  return (
    <div>
      <PageHeader title="Home" description="Your financial snapshot at a glance" />

      {loadingSummary ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Skeleton className="h-56 w-full lg:col-span-7 rounded-2xl" />
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Main Total Balance Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-7 text-white shadow-xl border border-indigo-500/20 lg:col-span-7 flex flex-col justify-between group">
            {/* Ambient Background Blur Elements */}
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-indigo-500/30" />
            <div className="absolute -left-10 -bottom-10 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl pointer-events-none transition-all duration-700 group-hover:bg-purple-500/30" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-inner">
                    <Wallet className="h-5 w-5 text-indigo-300" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-200/80">Total Net Balance</span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Balance
                      </span>
                    </div>
                  </div>
                </div>

                {primaryAccount && (
                  <span className="hidden sm:inline-flex text-xs font-mono text-indigo-200/80 bg-white/10 px-3 py-1 rounded-lg border border-white/15 backdrop-blur-sm">
                    A/C {maskAccountNumber(primaryAccount.account_number)}
                  </span>
                )}
              </div>

              <div className="py-1">
                <div className="flex items-center gap-3">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
                    {showBalance ? formatCurrency(totalBalance) : '₹ ••••••••'}
                  </p>
                  <button
                    type="button"
                    onClick={toggleShowBalance}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-indigo-200 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md border border-white/15"
                    title={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-xs font-medium text-indigo-200/80 flex items-center gap-1.5">
                  <span>Available balance:</span>
                  <strong className="text-white font-semibold">
                    {showBalance ? formatCurrency(totalAvailable) : '••••••••'}
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {primaryAccount && (
                  <Button
                    onClick={() => setOpenDepositModal(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 border-0 rounded-xl px-5 h-10 transition-all active:scale-95"
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Add Money
                  </Button>
                )}
                <Link to="/payments">
                  <Button
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-md rounded-xl px-5 h-10 transition-all active:scale-95"
                  >
                    <Send className="mr-1.5 h-4 w-4" /> Send Money
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Secondary Stats 2x2 Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
            {/* Monthly Income */}
            <Card className="relative overflow-hidden border border-[var(--color-border)] transition-all hover:shadow-md hover:border-emerald-500/30">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Monthly Income</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={16} />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text)]">
                    +{formatCurrency(monthlyIncome)}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">This month</span>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Spending */}
            <Card className="relative overflow-hidden border border-[var(--color-border)] transition-all hover:shadow-md hover:border-rose-500/30">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Monthly Spending</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <TrendingDown size={16} />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text)]">
                    {formatCurrency(monthlySpending)}
                  </p>
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">This month</span>
                </div>
              </CardContent>
            </Card>

            {/* Savings Goals */}
            <Card className="relative overflow-hidden border border-[var(--color-border)] transition-all hover:shadow-md hover:border-amber-500/30">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Savings Vaults</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <PiggyBank size={16} />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text)]">
                    {formatCurrency(totalSavings)}
                  </p>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">{savingsGoals.length} goal{savingsGoals.length !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>

            {/* Accounts Count */}
            <Card className="relative overflow-hidden border border-[var(--color-border)] transition-all hover:shadow-md hover:border-indigo-500/30">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Accounts</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Building2 size={16} />
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text)]">
                    {accounts.length} {accounts.length === 1 ? 'Active Account' : 'Active Accounts'}
                  </p>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">INR Currency</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mobile Quick Action Icon Bar (Matching Reference Banking UI) */}
      <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm">
        <button
          type="button"
          onClick={() => setOpenDepositModal(true)}
          className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all hover:bg-[var(--color-primary)]/10 active:scale-95 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
            <Plus size={20} />
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text)]">Deposit</span>
        </button>

        <Link
          to="/payments"
          className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all hover:bg-emerald-500/10 active:scale-95 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <Send size={20} />
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text)]">Transfer</span>
        </Link>

        <Link
          to="/accounts"
          className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all hover:bg-indigo-500/10 active:scale-95 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <Wallet size={20} />
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text)]">Accounts</span>
        </Link>

        <Link
          to="/cards"
          className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all hover:bg-purple-500/10 active:scale-95 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <CreditCard size={20} />
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text)]">Cards</span>
        </Link>

        <Link
          to="/analytics"
          className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all hover:bg-amber-500/10 active:scale-95 group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <BarChart3 size={20} />
          </div>
          <span className="text-[11px] font-semibold text-[var(--color-text)]">Analytics</span>
        </Link>
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

      {/* Quick Add Money Modal */}
      <Dialog open={openDepositModal} onClose={() => setOpenDepositModal(false)} title="Add Money to Account">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (depositAmount && Number(depositAmount) > 0) {
              depositMutation.mutate()
            }
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <Label htmlFor="depositAmount">Amount (INR)</Label>
            <Input
              id="depositAmount"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 5000"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {[1000, 5000, 10000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepositAmount(String(amt))}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
              >
                +₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenDepositModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={depositMutation.isPending} disabled={!depositAmount || Number(depositAmount) <= 0}>
              Confirm Deposit
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
