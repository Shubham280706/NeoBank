import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { beneficiariesApi, type Beneficiary } from '@/lib/api'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  nickname: z.string().optional(),
  account_number: z.string().optional(),
  ifsc: z.string().optional(),
  upi_id: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Beneficiaries() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Beneficiary | null>(null)
  const [deleting, setDeleting] = useState<Beneficiary | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['beneficiaries'], queryFn: beneficiariesApi.list })
  const beneficiaries = data || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? beneficiariesApi.update(editing.id, values) : beneficiariesApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
      toast({ title: editing ? 'Beneficiary updated' : 'Beneficiary added', variant: 'success' })
      setDialogOpen(false)
    },
    onError: (err) => toast({ title: 'Could not save beneficiary', description: (err as Error).message, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => beneficiariesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] })
      toast({ title: 'Beneficiary removed', variant: 'success' })
      setDeleting(null)
    },
    onError: (err) => toast({ title: 'Could not remove beneficiary', description: (err as Error).message, variant: 'error' }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', nickname: '', account_number: '', ifsc: '', upi_id: '' })
    setDialogOpen(true)
  }
  const openEdit = (b: Beneficiary) => {
    setEditing(b)
    reset({
      name: b.name,
      nickname: b.nickname || '',
      account_number: b.account_number || '',
      ifsc: b.ifsc || '',
      upi_id: b.upi_id || '',
    })
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Beneficiaries"
        description="Manage people you send money to"
        actions={
          <Button onClick={openCreate}>
            <Plus size={16} /> Add beneficiary
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : beneficiaries.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="No beneficiaries yet" description="Add one to start sending money." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beneficiaries.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{b.name}</p>
                    {b.nickname && <p className="text-xs text-[var(--color-text-muted)]">"{b.nickname}"</p>}
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
                <div className="mt-3 space-y-1 text-xs text-[var(--color-text-muted)]">
                  {b.account_number && <p>A/C: {b.account_number}</p>}
                  {b.ifsc && <p>IFSC: {b.ifsc}</p>}
                  {b.upi_id && <p>UPI: {b.upi_id}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit beneficiary' : 'Add beneficiary'}>
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register('name')} />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="nickname">Nickname (optional)</Label>
            <Input id="nickname" {...register('nickname')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="account_number">Account number</Label>
              <Input id="account_number" {...register('account_number')} />
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC</Label>
              <Input id="ifsc" {...register('ifsc')} />
            </div>
          </div>
          <div>
            <Label htmlFor="upi_id">UPI ID</Label>
            <Input id="upi_id" placeholder="name@upi" {...register('upi_id')} />
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
        title="Remove beneficiary?"
        description={`This will remove ${deleting?.name || 'this beneficiary'} from your list.`}
        confirmLabel="Remove"
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
