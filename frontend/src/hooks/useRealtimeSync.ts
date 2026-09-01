import { useEffect, useRef, useState } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './useAuth'

/**
 * Subscribes to postgres_changes for a given table filtered to the current
 * user's rows and invalidates the given TanStack Query key(s) on any change.
 */
export function useRealtimeSync(table: string, queryKeys: QueryKey[], userIdColumn = 'user_id') {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const userId = session?.user.id

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return

    const channel = supabase
      .channel(`realtime:${table}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${userIdColumn}=eq.${userId}`,
        },
        () => {
          queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, userId, JSON.stringify(queryKeys)])
}

export type RealtimeConnectionState = 'connected' | 'reconnecting' | 'disconnected'

/**
 * Reports the Supabase Realtime connection state so the UI can show a
 * Live / Reconnecting indicator. On reconnect, triggers a full invalidation
 * of the core financial queries so the UI never shows stale data after a drop.
 */
export function useRealtimeConnectionStatus() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RealtimeConnectionState>('disconnected')
  const wasDisconnected = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const socket = supabase.realtime

    // The realtime-js client doesn't expose public onOpen/onClose/onError hooks
    // in its typed surface, so we poll isConnected() instead — simple and
    // reliable enough for a demo "Live / Reconnecting" indicator.
    const checkConnection = () => {
      const connected = socket.isConnected()
      setStatus((prev) => {
        if (connected) {
          if (wasDisconnected.current) {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            wasDisconnected.current = false
          }
          return prev === 'connected' ? prev : 'connected'
        }
        wasDisconnected.current = true
        return prev === 'reconnecting' ? prev : 'reconnecting'
      })
    }

    checkConnection()
    const interval = setInterval(checkConnection, 3000)

    return () => clearInterval(interval)
  }, [queryClient])

  return status
}
