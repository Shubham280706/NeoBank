import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { banksApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { FxConverter } from '@/components/shared/FxConverter'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Landmark, Plus, Unlink } from 'lucide-react'
import type { Bank } from '@/lib/api'

export default function Settings() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [unlinking, setUnlinking] = useState<Bank | null>(null)

  const banksQuery = useQuery({ queryKey: ['banks'], queryFn: banksApi.list })
  const banks = banksQuery.data || []

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName, phone } })
      if (error) throw error
    },
    onSuccess: () => toast({ title: 'Profile updated', variant: 'success' }),
    onError: (err) => toast({ title: 'Could not update profile', description: (err as Error).message, variant: 'error' }),
  })

  const linkBankMutation = useMutation({
    mutationFn: () => banksApi.link({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] })
      toast({ title: 'Bank linked', description: 'A simulated bank account has been linked.', variant: 'success' })
    },
    onError: (err) => toast({ title: 'Could not link bank', description: (err as Error).message, variant: 'error' }),
  })

  const unlinkBankMutation = useMutation({
    mutationFn: (id: string) => banksApi.unlink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] })
      toast({ title: 'Bank unlinked', variant: 'success' })
      setUnlinking(null)
    },
    onError: (err) => toast({ title: 'Could not unlink bank', description: (err as Error).message, variant: 'error' }),
  })

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, preferences and linked banks" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button loading={saveProfileMutation.isPending} onClick={() => saveProfileMutation.mutate()}>
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Linked banks</CardTitle>
              <CardDescription>External bank accounts linked to NeoBank</CardDescription>
            </div>
            <Button size="sm" onClick={() => linkBankMutation.mutate()} loading={linkBankMutation.isPending}>
              <Plus size={14} /> Link bank
            </Button>
          </CardHeader>
          <CardContent>
            {banksQuery.isLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
            ) : banks.length === 0 ? (
              <EmptyState icon={<Landmark size={28} />} title="No linked banks" description="Link an external bank account to aggregate balances." />
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {banks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
                        <Landmark size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">{b.institution_name || 'Linked Bank'}</p>
                        <Badge variant="positive">{b.status || 'active'}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setUnlinking(b)} aria-label="Unlink">
                      <Unlink size={16} className="text-[var(--color-negative)]" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <FxConverter />
      </div>

      <ConfirmDialog
        open={Boolean(unlinking)}
        onClose={() => setUnlinking(null)}
        onConfirm={() => unlinking && unlinkBankMutation.mutate(unlinking.id)}
        title="Unlink this bank?"
        description="You can relink it again later."
        confirmLabel="Unlink"
        destructive
        loading={unlinkBankMutation.isPending}
      />
    </div>
  )
}
