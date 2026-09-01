import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetsApi, type Budget } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Label, Select, FieldError } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react'

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Enter a valid amount'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
})
type FormValues = z.infer<typeof schema>

export default function Budgets() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)
  const warnedRef = useRef<Record<string, number>>({})

  const { data, isLoading } = useQuery({ queryKey: ['budgets'], queryFn: budgetsApi.list })
  useRealtimeSync('budgets', [['budgets']])
  const budgets = data || []

  useEffect(() => {
    budgets.forEach((b) => {
      const pct = b.percentUsed ?? (b.spent && b.amount ? (b.spent / b.amount) * 100 : 0)
      const last = warnedRef.current[b.id] ?? 0
      const threshold = pct >= 100 ? 100 : pct >= 90 ? 90 : pct >= 70 ? 70 : 0
      if (threshold > last) {
        warnedRef.current[b.id] = threshold
        if (threshold === 100) {
          toast({ title: `${b.category} budget exceeded`, description: 'You have spent over 100% of this budget.', variant: 'error' })
        } else if (threshold >= 70) {
          toast({ title: `${b.category} budget at ${threshold}%`, description: 'Consider slowing down spending in this category.', variant: 'warning' })
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(budgets.map((b) => [b.id, b.percentUsed, b.spent]))])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { period: 'monthly' } })

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => (editing ? budgetsApi.update(editing.id, values) : budgetsApi.create(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({ title: editing ? 'Budget updated' : 'Budget created', variant: 'success' })
      setDialogOpen(false)
    },
    onError: (err) => toast({ title: 'Could not save budget', description: (err as Error).message, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => budgetsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({ title: 'Budget deleted', variant: 'success' })
      setDeleting(null)
    },
    onError: (err) => toast({ title: 'Could not delete budget', description: (err as Error).message, variant: 'error' }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ category: '', amount: 0, period: 'monthly' })
    setDialogOpen(true)
  }
  const openEdit = (b: Budget) => {
    setEditing(b)
    reset({ category: b.category, amount: b.amount, period: (b.period as FormValues['period']) || 'monthly' })
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set spending limits per category and track progress"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> New budget
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : budgets.length === 0 ? (
        <EmptyState icon={<PiggyBank size={32} />} title="No budgets yet" description="Create a budget to start tracking spending." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const pct = Math.min(100, b.percentUsed ?? (b.spent && b.amount ? (b.spent / b.amount) * 100 : 0))
            const danger = pct >= 100
            const warn = pct >= 70
            return (
              <Card key={b.id}>
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">{b.category}</p>
                        <p className="text-xs capitalize text-[var(--color-text-muted)]">{b.period || 'monthly'} limit</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)} aria-label="Edit">
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(b)} aria-label="Delete">
                          <Trash2 size={14} className="text-[var(--color-negative)]" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-[var(--color-text-muted)] font-medium">
                        <span>{formatCurrency(b.spent || 0)} spent</span>
                        <span className="font-semibold text-[var(--color-text)]">{formatCurrency(b.amount)} limit</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            danger ? 'bg-[var(--color-negative)]' : warn ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-positive)]',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className={cn('mt-1.5 text-xs font-semibold', danger ? 'text-[var(--color-negative)]' : warn ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]')}>
                        {Math.round(pct)}% used {danger && '— limit reached!'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Spending limit</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(b)}
                      className="h-8 text-xs font-semibold rounded-lg"
                    >
                      <Pencil size={12} className="mr-1" /> Adjust Limit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit budget' : 'New budget'}>
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-3">
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" placeholder="Groceries, Dining, Travel..." {...register('category')} />
            <FieldError>{errors.category?.message}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input id="amount" type="number" step="0.01" {...register('amount')} />
              <FieldError>{errors.amount?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Select id="period" {...register('period')}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Delete this budget?"
        description={`This will remove the ${deleting?.category || ''} budget.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
