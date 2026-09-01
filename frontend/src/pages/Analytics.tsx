import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const CHART_COLORS = ['#4f46e5', '#1e3a8a', '#16a34a', '#d97706', '#dc2626', '#0ea5e9', '#9333ea']

export default function Analytics() {
  const categoriesQuery = useQuery({ queryKey: ['analytics', 'categories'], queryFn: analyticsApi.categories })
  const monthlyQuery = useQuery({ queryKey: ['analytics', 'monthly'], queryFn: analyticsApi.monthly })

  const categories = categoriesQuery.data || []
  const monthly = monthlyQuery.data || []

  return (
    <div>
      <PageHeader title="Analytics" description="Understand your income and spending patterns" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income vs spending</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyQuery.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : monthly.length === 0 ? (
              <EmptyState title="No monthly data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="spending" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesQuery.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : categories.length === 0 ? (
              <EmptyState title="No category data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categories} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={100} paddingAngle={2}>
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

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriesQuery.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : categories.length === 0 ? (
              <EmptyState title="No category data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="category" stroke="var(--color-text-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                  <Tooltip formatter={(v: unknown) => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
