import { CreditCard, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Card as CardType } from '@/lib/api'

export function VirtualCard({ card, className }: { card: CardType; className?: string }) {
  const frozen = card.status === 'FROZEN'
  const reported = card.status === 'REPORTED'
  const expiry =
    card.expiry_month && card.expiry_year
      ? `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`
      : '••/••'
  return (
    <div
      className={cn(
        'relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl p-5 text-white shadow-lg',
        'bg-gradient-to-br from-[#1e3a8a] via-[#3730a3] to-[#4f46e5]',
        (frozen || reported) && 'grayscale',
        className,
      )}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/10 blur-xl" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-white/70">
            {card.card_type || 'Debit'} Card
          </span>
          <Wifi className="rotate-90 opacity-80" size={18} />
        </div>
        <div>
          <p className="font-mono text-lg tracking-widest sm:text-xl">
            {`•••• •••• •••• ${card.last4 || '0000'}`}
          </p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase text-white/60">Card Holder</p>
              <p className="text-sm font-medium">{card.cardholder_name || 'Card Holder'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-white/60">Expires</p>
              <p className="text-sm font-medium">{expiry}</p>
            </div>
            <CreditCard size={26} className="opacity-90" />
          </div>
        </div>
      </div>
      {(frozen || reported) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black">
            {reported ? 'REPORTED' : 'FROZEN'}
          </span>
        </div>
      )}
    </div>
  )
}
