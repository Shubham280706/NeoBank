import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { kycApi } from '@/lib/api'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Label, Select, FieldError } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Loader2, XCircle, ShieldAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'

const schema = z.object({
  documentType: z.enum(['AADHAAR', 'PAN', 'PASSPORT', 'VOTER_ID']),
  documentNumber: z.string().min(4, 'Enter a valid document number'),
})
type FormValues = z.infer<typeof schema>

const STEPS = ['SUBMITTED', 'PROCESSING', 'VERIFIED'] as const

export default function Kyc() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const prevStatus = useRef<string | undefined>(undefined)

  const { data: status, isLoading } = useQuery({ queryKey: ['kyc', 'status'], queryFn: kycApi.status })
  useRealtimeSync('kyc_verifications', [['kyc', 'status']])

  useEffect(() => {
    if (status?.status && prevStatus.current && status.status !== prevStatus.current) {
      if (status.status === 'VERIFIED') {
        toast({ title: 'KYC verified', description: 'Your identity has been verified (demo).', variant: 'success' })
      } else if (status.status === 'FAILED') {
        toast({ title: 'KYC verification failed', description: 'Please resubmit your documents.', variant: 'error' })
      } else if (status.status === 'PROCESSING') {
        toast({ title: 'KYC processing', description: 'We are reviewing your documents (demo).', variant: 'info' })
      }
    }
    prevStatus.current = status?.status
  }, [status?.status, toast])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const submitMutation = useMutation({
    mutationFn: (values: FormValues) => kycApi.submit(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc', 'status'] })
      toast({ title: 'KYC submitted', description: 'Your documents were submitted for review.', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Submission failed', description: (err as Error).message, variant: 'error' }),
  })

  const currentStatus = status?.status || 'NOT_SUBMITTED'
  const currentIndex = STEPS.indexOf(currentStatus as (typeof STEPS)[number])
  const failed = currentStatus === 'FAILED'

  return (
    <div>
      <PageHeader title="KYC Verification" description="Verify your identity to unlock all features" />

      <div className="mb-4 flex items-start gap-2 rounded-lg bg-[var(--color-warning-bg)] p-3 text-xs text-[var(--color-warning)]">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <span>Demo verification — no real identity verification is performed. All data here is simulated.</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
            ) : failed ? (
              <div className="flex items-center gap-2 text-[var(--color-negative)]">
                <XCircle size={20} />
                <span className="text-sm font-medium">Verification failed — please resubmit</span>
              </div>
            ) : (
              <div className="space-y-4">
                {STEPS.map((step, i) => {
                  const done = i < currentIndex || currentStatus === 'VERIFIED'
                  const active = i === currentIndex && currentStatus !== 'VERIFIED'
                  return (
                    <div key={step} className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle2 size={20} className="text-[var(--color-positive)]" />
                      ) : active ? (
                        <Loader2 size={20} className="animate-spin text-[var(--color-primary)]" />
                      ) : (
                        <Circle size={20} className="text-[var(--color-text-muted)]" />
                      )}
                      <span
                        className={cn(
                          'text-sm font-medium',
                          done || active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]',
                        )}
                      >
                        {step.charAt(0) + step.slice(1).toLowerCase()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {status?.documentType && (
              <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                Submitted: {status.documentType} ending in {String(status.documentNumber || '').slice(-4)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit documents</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((v) => submitMutation.mutate(v))} className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document type</Label>
                <Select id="documentType" {...register('documentType')}>
                  <option value="AADHAAR">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VOTER_ID">Voter ID</option>
                </Select>
                <FieldError>{errors.documentType?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="documentNumber">Document number</Label>
                <Input id="documentNumber" placeholder="XXXX-XXXX-XXXX" {...register('documentNumber')} />
                <FieldError>{errors.documentNumber?.message}</FieldError>
              </div>
              <Button type="submit" className="w-full" loading={submitMutation.isPending}>
                Submit for verification
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
