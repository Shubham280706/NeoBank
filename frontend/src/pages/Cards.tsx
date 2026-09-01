import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cardsApi, type Card as CardType } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { VirtualCard } from '@/components/shared/VirtualCard'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Label } from '@/components/ui/Input'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Snowflake, Flame, Plus, Settings2, ShieldAlert, Receipt } from 'lucide-react'

export default function Cards() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState<{ card: CardType; type: 'freeze' | 'unfreeze' | 'report' } | null>(null)
  const [limitDialogCard, setLimitDialogCard] = useState<CardType | null>(null)
  const [limitValue, setLimitValue] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newSpendingLimit, setNewSpendingLimit] = useState('100000')
  const [newDailyLimit, setNewDailyLimit] = useState('25000')
  const [txCard, setTxCard] = useState<CardType | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['cards'], queryFn: cardsApi.list })
  useRealtimeSync('cards', [['cards']])
  const cards = data || []

  const txQuery = useQuery({
    queryKey: ['cards', txCard?.id, 'transactions'],
    queryFn: () => cardsApi.transactions(txCard!.id),
    enabled: Boolean(txCard),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cards'] })

  const freezeMutation = useMutation({
    mutationFn: (id: string) => cardsApi.freeze(id),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Card frozen', variant: 'success' })
      setConfirmAction(null)
    },
    onError: (err) => toast({ title: 'Could not freeze card', description: (err as Error).message, variant: 'error' }),
  })
  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => cardsApi.unfreeze(id),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Card unfrozen', variant: 'success' })
      setConfirmAction(null)
    },
    onError: (err) => toast({ title: 'Could not unfreeze card', description: (err as Error).message, variant: 'error' }),
  })
  const reportMutation = useMutation({
    mutationFn: (id: string) => cardsApi.report(id, 'Lost or stolen (demo)'),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Card reported', description: 'A replacement will be simulated shortly.', variant: 'success' })
      setConfirmAction(null)
    },
    onError: (err) => toast({ title: 'Could not report card', description: (err as Error).message, variant: 'error' }),
  })
  const limitMutation = useMutation({
    mutationFn: ({ id, limit }: { id: string; limit: number }) => cardsApi.setLimit(id, limit),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Limit updated', variant: 'success' })
      setLimitDialogCard(null)
    },
    onError: (err) => toast({ title: 'Could not update limit', description: (err as Error).message, variant: 'error' }),
  })
  const createMutation = useMutation({
    mutationFn: () =>
      cardsApi.create({
        spendingLimit: Number(newSpendingLimit) || undefined,
        dailyLimit: Number(newDailyLimit) || undefined,
      }),
    onSuccess: () => {
      invalidate()
      toast({ title: 'Card created', variant: 'success' })
      setCreateOpen(false)
    },
    onError: (err) => toast({ title: 'Could not create card', description: (err as Error).message, variant: 'error' }),
  })

  const runConfirm = () => {
    if (!confirmAction) return
    if (confirmAction.type === 'freeze') freezeMutation.mutate(confirmAction.card.id)
    if (confirmAction.type === 'unfreeze') unfreezeMutation.mutate(confirmAction.card.id)
    if (confirmAction.type === 'report') reportMutation.mutate(confirmAction.card.id)
  }

  return (
    <div>
      <PageHeader
        title="Cards"
        description="Manage your debit and credit cards"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> New card
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading cards…</p>
      ) : cards.length === 0 ? (
        <EmptyState title="No cards yet" description="Create your first simulated card." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {cards.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-col items-center gap-4 p-5">
                <VirtualCard card={c} />
                <div className="flex w-full items-center justify-between">
                  <Badge variant={statusToBadgeVariant(c.status)}>{c.status || 'ACTIVE'}</Badge>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Limit: {c.spending_limit != null ? formatCurrency(c.spending_limit) : '—'}
                  </span>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  {c.status === 'FROZEN' ? (
                    <Button variant="outline" size="sm" onClick={() => setConfirmAction({ card: c, type: 'unfreeze' })}>
                      <Snowflake size={14} /> Unfreeze
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setConfirmAction({ card: c, type: 'freeze' })}>
                      <Snowflake size={14} /> Freeze
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLimitDialogCard(c)
                      setLimitValue(String(c.spending_limit ?? ''))
                    }}
                  >
                    <Settings2 size={14} /> Limit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTxCard(c)}>
                    <Receipt size={14} /> History
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setConfirmAction({ card: c, type: 'report' })}>
                    <Flame size={14} /> Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirm}
        title={
          confirmAction?.type === 'freeze'
            ? 'Freeze this card?'
            : confirmAction?.type === 'unfreeze'
              ? 'Unfreeze this card?'
              : 'Report this card as lost/stolen?'
        }
        description={
          confirmAction?.type === 'report'
            ? 'This will permanently disable the card and simulate ordering a replacement.'
            : 'You can change this back at any time.'
        }
        confirmLabel={confirmAction?.type === 'report' ? 'Report card' : 'Confirm'}
        destructive={confirmAction?.type === 'report'}
        loading={freezeMutation.isPending || unfreezeMutation.isPending || reportMutation.isPending}
      />

      <Dialog open={Boolean(limitDialogCard)} onClose={() => setLimitDialogCard(null)} title="Set spending limit">
        <div className="space-y-3">
          <div>
            <Label htmlFor="limit">Monthly limit (INR)</Label>
            <Input id="limit" type="number" value={limitValue} onChange={(e) => setLimitValue(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLimitDialogCard(null)}>
              Cancel
            </Button>
            <Button
              loading={limitMutation.isPending}
              onClick={() => limitDialogCard && limitMutation.mutate({ id: limitDialogCard.id, limit: Number(limitValue) })}
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create a new card">
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          A new simulated virtual card will be issued to your account. Set its limits below.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="newSpendingLimit">Spending limit (₹)</Label>
            <Input
              id="newSpendingLimit"
              type="number"
              min={0}
              value={newSpendingLimit}
              onChange={(e) => setNewSpendingLimit(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newDailyLimit">Daily limit (₹)</Label>
            <Input
              id="newDailyLimit"
              type="number"
              min={0}
              value={newDailyLimit}
              onChange={(e) => setNewDailyLimit(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            Create card
          </Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(txCard)} onClose={() => setTxCard(null)} title="Card transactions" className="max-w-lg">
        {txQuery.isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : !txQuery.data || txQuery.data.length === 0 ? (
          <EmptyState icon={<ShieldAlert size={28} />} title="No transactions for this card" />
        ) : (
          <div className="max-h-96 divide-y divide-[var(--color-border)] overflow-y-auto">
            {txQuery.data.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-text)]">{t.merchant || t.description}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDateTime(t.created_at)}</p>
                </div>
                <span className="font-semibold">{formatCurrency(Math.abs(t.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  )
}
