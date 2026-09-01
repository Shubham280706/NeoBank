import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi, beneficiariesApi, transfersApi } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { QrCode } from '@/components/shared/QrCode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Label, Select, Textarea, FieldError } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDateTime, maskAccountNumber } from '@/lib/utils'
import { Send, QrCode as QrIcon, Copy, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const transferSchema = z.object({
  senderAccountId: z.string().min(1, 'Select an account'),
  beneficiaryId: z.string().optional(),
  newBeneficiaryUpi: z.string().optional(),
  amount: z.coerce.number().positive('Enter a valid amount'),
  transferType: z.enum(['UPI', 'IMPS', 'NEFT', 'RTGS']),
  category: z.string().optional(),
  remarks: z.string().optional(),
})
type TransferFormValues = z.infer<typeof transferSchema>

export default function Payments() {
  const { toast } = useToast()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [beneficiaryMode, setBeneficiaryMode] = useState<'existing' | 'new'>('existing')

  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list })
  const beneficiariesQuery = useQuery({ queryKey: ['beneficiaries'], queryFn: beneficiariesApi.list })
  const transfersQuery = useQuery({ queryKey: ['transfers'], queryFn: () => transfersApi.list({ pageSize: 10 }) })
  useRealtimeSync('transfers', [['transfers']])
  useRealtimeSync('transactions', [['transactions']])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { transferType: 'UPI', category: 'Entertainment' },
  })

  const transferMutation = useMutation({
    mutationFn: (values: TransferFormValues) =>
      transfersApi.create({
        senderAccountId: values.senderAccountId,
        beneficiaryId: beneficiaryMode === 'existing' ? values.beneficiaryId : undefined,
        merchant: beneficiaryMode === 'new' ? values.newBeneficiaryUpi : undefined,
        recipientUpiId: beneficiaryMode === 'new' ? values.newBeneficiaryUpi : undefined,
        amount: values.amount,
        transferType: values.transferType,
        category: values.category || 'Entertainment',
        remarks: values.remarks,
        idempotencyKey: crypto.randomUUID(),
      }),
    onSuccess: () => {
      toast({ title: 'Transfer successful', description: 'Your money has been sent (simulated).', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      reset({ transferType: watch('transferType') })
    },
    onError: (err) => {
      toast({ title: 'Transfer failed', description: (err as Error).message, variant: 'error' })
    },
  })

  const accounts = accountsQuery.data || []
  const beneficiaries = beneficiariesQuery.data || []
  const transfers = transfersQuery.data?.data || []
  const upiId = profile?.upi_id || `${(profile?.first_name || 'user').toLowerCase()}@neobank`

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Send money, pay via UPI and manage transfers"
        actions={
          <Link to="/beneficiaries">
            <Button variant="outline">
              <Users size={16} /> Beneficiaries
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="transfer">
        <TabsList className="mb-6">
          <TabsTrigger value="transfer">Send Money</TabsTrigger>
          <TabsTrigger value="upi">UPI</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Transfer money</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((v) => transferMutation.mutate(v))} className="space-y-4">
                  <div>
                    <Label htmlFor="senderAccountId">From account</Label>
                    <Select id="senderAccountId" {...register('senderAccountId')}>
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {maskAccountNumber(a.account_number)} — {formatCurrency(a.balance)}
                        </option>
                      ))}
                    </Select>
                    <FieldError>{errors.senderAccountId?.message}</FieldError>
                  </div>

                  <div>
                    <Label>Send to</Label>
                    <div className="mb-2 inline-flex rounded-lg bg-[var(--color-surface-2)] p-1 text-sm">
                      <button
                        type="button"
                        onClick={() => setBeneficiaryMode('existing')}
                        className={`rounded-md px-3 py-1 ${beneficiaryMode === 'existing' ? 'bg-[var(--color-surface)] shadow-sm' : ''}`}
                      >
                        Existing beneficiary
                      </button>
                      <button
                        type="button"
                        onClick={() => setBeneficiaryMode('new')}
                        className={`rounded-md px-3 py-1 ${beneficiaryMode === 'new' ? 'bg-[var(--color-surface)] shadow-sm' : ''}`}
                      >
                        New UPI ID
                      </button>
                    </div>
                    {beneficiaryMode === 'existing' ? (
                      <Select {...register('beneficiaryId')}>
                        <option value="">Select beneficiary</option>
                        {beneficiaries.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} {b.upi_id ? `(${b.upi_id})` : ''}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input placeholder="name@upi" {...register('newBeneficiaryUpi')} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="amount">Amount (INR)</Label>
                      <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount')} />
                      <FieldError>{errors.amount?.message}</FieldError>
                    </div>
                    <div>
                      <Label htmlFor="category">Category (for Budgets)</Label>
                      <Select id="category" {...register('category')}>
                        <option value="Entertainment">🎬 Entertainment</option>
                        <option value="Subscriptions">📱 Subscriptions</option>
                        <option value="Dining">🍔 Dining & Food</option>
                        <option value="Shopping">🛍️ Shopping</option>
                        <option value="Travel">🚗 Travel & Fuel</option>
                        <option value="Utilities">⚡ Bills & Utilities</option>
                        <option value="Groceries">🛒 Groceries</option>
                        <option value="Transfer">💸 General Transfer</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="transferType">Transfer type</Label>
                      <Select id="transferType" {...register('transferType')}>
                        <option value="UPI">UPI</option>
                        <option value="IMPS">IMPS</option>
                        <option value="NEFT">NEFT</option>
                        <option value="RTGS">RTGS</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks (optional)</Label>
                    <Textarea id="remarks" placeholder="What's this for? (e.g. Movie tickets, Spotify subscription)" {...register('remarks')} />
                  </div>

                  <Button type="submit" className="w-full" loading={transferMutation.isPending}>
                    <Send size={16} /> Send money
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--color-text-muted)]">
                <p>UPI transfers are instant and free for amounts up to ₹1,00,000.</p>
                <p>IMPS is instant 24x7. NEFT/RTGS may take longer and follow banking hours.</p>
                <p className="text-[var(--color-warning)]">This is a simulated environment — no real money moves.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upi">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your UPI ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-2)] px-4 py-3">
                  <span className="font-mono text-sm text-[var(--color-text)]">{upiId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard?.writeText(upiId)
                      toast({ title: 'Copied UPI ID', variant: 'info' })
                    }}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <QrCode value={`upi://pay?pa=${upiId}&pn=${profile?.first_name || 'NeoBank User'}`} />
                  <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                    <QrIcon size={12} /> Scan to pay this UPI ID (simulated)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Send to UPI ID / Request money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="upiPay">Send to UPI ID</Label>
                  <div className="flex gap-2">
                    <Input id="upiPay" placeholder="friend@upi" />
                    <Button variant="secondary">Pay</Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="upiRequest">Request money from UPI ID</Label>
                  <div className="flex gap-2">
                    <Input id="upiRequest" placeholder="friend@upi" />
                    <Button variant="outline">Request</Button>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Use the Send Money tab to complete a simulated transfer with amount and remarks.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              {transfers.length === 0 ? (
                <EmptyState title="No transfers yet" description="Your sent transfers will appear here." />
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {transfers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          {t.transferType} transfer {t.remarks ? `— ${t.remarks}` : ''}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">{t.created_at && formatDateTime(t.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusToBadgeVariant(t.status)}>{t.status || 'pending'}</Badge>
                        <span className="text-sm font-semibold text-[var(--color-text)]">{formatCurrency(t.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
