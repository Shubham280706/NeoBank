import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { savingsApi, type SavingsGoal } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Label, Select, FieldError } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Pencil, Trash2, Target, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

const goalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  target_amount: z.coerce.number().positive('Enter a valid amount'),
  deadline: z.string().optional(),
})
type GoalFormValues = z.infer<typeof goalSchema>

const contributeSchema = z.object({
  amount: z.coerce.number().positive('Enter a valid amount'),
  type: z.enum(['deposit', 'withdraw']),
})
type ContributeFormValues = z.infer<typeof contributeSchema>

function ProgressRing({ percent }: { percent: number }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, percent) / 100) * circumference
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0 -rotate-90">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <text x="40" y="44" textAnchor="middle" fill="var(--color-text)" fontSize="16" fontWeight="600" className="rotate-90" transform="rotate(90 40 40)">
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

export default function Savings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null)
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['savings'], queryFn: savingsApi.list })
  useRealtimeSync('savings_goals', [['savings']])
  const goals = data || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({ resolver: zodResolver(goalSchema) })

  const {
    register: registerContribute,
    handleSubmit: handleSubmitContribute,
    reset: resetContribute,
    formState: { errors: contributeErrors },
  } = useForm<ContributeFormValues>({ resolver: zodResolver(contributeSchema), defaultValues: { type: 'deposit' } })

  const saveMutation = useMutation({
    mutationFn: (values: GoalFormValues) => (editing ? savingsApi.update(editing.id, values) : savingsApi.create(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
      toast({ title: editing ? 'Goal updated' : 'Goal created', variant: 'success' })
      setDialogOpen(false)
    },
    onError: (err) => toast({ title: 'Could not save goal', description: (err as Error).message, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => savingsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
      toast({ title: 'Goal deleted', variant: 'success' })
      setDeleting(null)
    },
    onError: (err) => toast({ title: 'Could not delete goal', description: (err as Error).message, variant: 'error' }),
  })

  const contributeMutation = useMutation({
    mutationFn: (values: ContributeFormValues) => savingsApi.contribute(contributingGoal!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
      toast({ title: 'Savings updated', variant: 'success' })
      setContributingGoal(null)
    },
    onError: (err) => toast({ title: 'Could not update savings', description: (err as Error).message, variant: 'error' }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', target_amount: 0, deadline: '' })
    setDialogOpen(true)
  }
  const openEdit = (g: SavingsGoal) => {
    setEditing(g)
    reset({ name: g.name, target_amount: g.target_amount, deadline: g.deadline || '' })
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        description="Save towards what matters to you"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> New goal
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
      ) : goals.length === 0 ? (
        <EmptyState icon={<Target size={32} />} title="No savings goals yet" description="Create your first goal to start saving." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const pct = Math.min(100, ((g.current_amount || 0) / (g.target_amount || 1)) * 100)
            return (
              <Card key={g.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ProgressRing percent={pct} />
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{g.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {formatCurrency(g.current_amount || 0)} / {formatCurrency(g.target_amount)}
                        </p>
                        {g.deadline && <p className="text-xs text-[var(--color-text-muted)]">By {formatDate(g.deadline)}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(g)} aria-label="Edit">
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(g)} aria-label="Delete">
                        <Trash2 size={14} className="text-[var(--color-negative)]" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setContributingGoal(g)
                        resetContribute({ amount: 0, type: 'deposit' })
                      }}
                    >
                      <ArrowUpCircle size={14} /> Contribute
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setContributingGoal(g)
                        resetContribute({ amount: 0, type: 'withdraw' })
                      }}
                    >
                      <ArrowDownCircle size={14} /> Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit goal' : 'New savings goal'}>
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-3">
          <div>
            <Label htmlFor="name">Goal name</Label>
            <Input id="name" placeholder="Emergency fund, Vacation..." {...register('name')} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="target_amount">Target amount (INR)</Label>
              <Input id="target_amount" type="number" step="0.01" {...register('target_amount')} />
              <FieldError>{errors.target_amount?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="deadline">Deadline (optional)</Label>
              <Input id="deadline" type="date" {...register('deadline')} />
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

      <Dialog
        open={Boolean(contributingGoal)}
        onClose={() => setContributingGoal(null)}
        title={`Update ${contributingGoal?.name || 'goal'}`}
      >
        <form onSubmit={handleSubmitContribute((v) => contributeMutation.mutate(v))} className="space-y-3">
          <div>
            <Label htmlFor="c-amount">Amount (INR)</Label>
            <Input id="c-amount" type="number" step="0.01" {...registerContribute('amount')} />
            <FieldError>{contributeErrors.amount?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="c-type">Type</Label>
            <Select id="c-type" {...registerContribute('type')}>
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setContributingGoal(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={contributeMutation.isPending}>
              Confirm
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        title="Delete this goal?"
        description={`This will remove the "${deleting?.name || ''}" goal.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
