import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi, type BankAccount } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Label, Select } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, maskAccountNumber } from '@/lib/utils'
import { Wallet, Plus, ArrowDownToLine } from 'lucide-react'

export default function Accounts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [openCreate, setOpenCreate] = useState(false)
  const [newAccountType, setNewAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS')
  const [depositAccount, setDepositAccount] = useState<BankAccount | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  useRealtimeSync('bank_accounts', [['accounts']])
  useRealtimeSync('transactions', [['transactions'], ['analytics', 'overview'], ['analytics', 'categories']])

  const accounts = data || []

  const createMutation = useMutation({
    mutationFn: () => accountsApi.create(newAccountType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast({ title: 'Account opened', description: 'Your new account is ready to use.', variant: 'success' })
      setOpenCreate(false)
    },
    onError: (err) => toast({ title: 'Could not open account', description: (err as Error).message, variant: 'error' }),
  })

  const depositMutation = useMutation({
    mutationFn: () => accountsApi.deposit(depositAccount!.id, Number(depositAmount)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast({ title: 'Money added', description: 'Your simulated deposit was successful.', variant: 'success' })
      setDepositAccount(null)
      setDepositAmount('')
    },
    onError: (err) => toast({ title: 'Could not add money', description: (err as Error).message, variant: 'error' }),
  })

  return (
    <div>
      <PageHeader
        title="Accounts"
        description="All your simulated bank accounts"
        actions={
          <Button onClick={() => setOpenCreate(true)}>
            <Plus size={16} /> Open account
          </Button>
        }
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={32} />}
          title="No accounts yet"
          description="Open your first simulated account to start banking."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="accent">{a.account_type || 'SAVINGS'}</Badge>
                  {a.currency && <span className="text-xs text-[var(--color-text-muted)]">{a.currency}</span>}
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text)]">{formatCurrency(a.balance)}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Available: {formatCurrency(a.available_balance ?? a.balance)}
                </p>
                <div className="mt-4 border-t border-[var(--color-border)] pt-3 text-sm">
                  <p className="font-mono text-[var(--color-text)]">{maskAccountNumber(a.account_number)}</p>
                  {a.ifsc && <p className="text-xs text-[var(--color-text-muted)]">IFSC: {a.ifsc}</p>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setDepositAccount(a)
                    setDepositAmount('')
                  }}
                >
                  <ArrowDownToLine size={14} /> Add money
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} title="Open a new account">
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          A new simulated bank account will be opened in your name with a ₹0 starting balance.
        </p>
        <Label htmlFor="accountType">Account type</Label>
        <Select id="accountType" value={newAccountType} onChange={(e) => setNewAccountType(e.target.value as 'SAVINGS' | 'CURRENT')}>
          <option value="SAVINGS">Savings</option>
          <option value="CURRENT">Current</option>
        </Select>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpenCreate(false)}>
            Cancel
          </Button>
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            Open account
          </Button>
        </div>
      </Dialog>

      <Dialog open={Boolean(depositAccount)} onClose={() => setDepositAccount(null)} title="Add money">
        <p className="mb-4 text-sm text-[var(--color-text-muted)]">
          Simulates money arriving from UPI or a linked bank — no real funds move. Credited instantly to{' '}
          {depositAccount && maskAccountNumber(depositAccount.account_number)}.
        </p>
        <Label htmlFor="depositAmount">Amount (INR)</Label>
        <Input
          id="depositAmount"
          type="number"
          min={1}
          placeholder="0.00"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDepositAccount(null)}>
            Cancel
          </Button>
          <Button
            loading={depositMutation.isPending}
            disabled={!depositAmount || Number(depositAmount) <= 0}
            onClick={() => depositMutation.mutate()}
          >
            Add money
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
