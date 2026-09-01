import { useRealtimeConnectionStatus } from '@/hooks/useRealtimeSync'
import { cn } from '@/lib/utils'

export function LiveIndicator() {
  const status = useRealtimeConnectionStatus()
  const connected = status === 'connected'
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        connected ? 'bg-[var(--color-positive-bg)] text-[var(--color-positive)]' : 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
      )}
      title={connected ? 'Realtime connected' : 'Realtime reconnecting'}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          connected ? 'bg-[var(--color-positive)]' : 'animate-pulse bg-[var(--color-warning)]',
        )}
      />
      {connected ? 'Live' : 'Reconnecting'}
    </div>
  )
}
