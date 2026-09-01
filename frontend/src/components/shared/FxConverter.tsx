import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { fxApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { ArrowRightLeft } from 'lucide-react'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'JPY', 'SGD', 'AUD']

export function FxConverter() {
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('INR')
  const [amount, setAmount] = useState('100')

  const convertMutation = useMutation({
    mutationFn: () => fxApi.convert(from, to, Number(amount) || 0),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency converter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">From</label>
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="mb-0.5"
            onClick={() => {
              setFrom(to)
              setTo(from)
            }}
          >
            <ArrowRightLeft size={16} />
          </Button>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">To</label>
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">Amount</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <Button className="w-full" loading={convertMutation.isPending} onClick={() => convertMutation.mutate()}>
          Convert
        </Button>
        {convertMutation.data && (
          <div className="rounded-lg bg-[var(--color-surface-2)] p-3 text-center">
            <p className="text-lg font-semibold text-[var(--color-text)]">
              {formatCurrency(convertMutation.data.convertedAmount ?? convertMutation.data.result ?? 0, to)}
            </p>
            {convertMutation.data.rate && (
              <p className="text-xs text-[var(--color-text-muted)]">
                1 {from} = {convertMutation.data.rate} {to}
              </p>
            )}
          </div>
        )}
        {convertMutation.isError && (
          <p className="text-xs text-[var(--color-negative)]">Could not fetch conversion rate right now.</p>
        )}
      </CardContent>
    </Card>
  )
}
