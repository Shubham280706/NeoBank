import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useToast } from './useToast'
import { formatCurrency } from '@/lib/utils'

export function useMoneyReceivedListener() {
  const { session } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const userId = session?.user.id

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return

    // 1. Listen for new incoming credit transactions
    const txChannel = supabase
      .channel(`realtime:incoming_tx:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newTx = payload.new as {
            type?: string
            amount?: number
            merchant?: string
            description?: string
          }

          if (newTx?.type === 'CREDIT') {
            const senderName = newTx.merchant || newTx.description || 'NeoBank user'
            const amountFormatted = formatCurrency(Number(newTx.amount || 0))

            toast({
              title: '🎉 Money Received!',
              description: `${amountFormatted} received from ${senderName}.`,
              variant: 'success',
            })

            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['analytics'] })
          }
        },
      )
      .subscribe()

    // 2. Listen for new notifications
    const notifChannel = supabase
      .channel(`realtime:incoming_notif:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as {
            title?: string
            message?: string
            type?: string
          }

          if (newNotif?.title || newNotif?.message) {
            toast({
              title: newNotif.title || 'New Notification',
              description: newNotif.message || '',
              variant: newNotif.type === 'TRANSFER' || newNotif.type === 'TRANSACTION' ? 'success' : 'info',
            })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(txChannel)
      supabase.removeChannel(notifChannel)
    }
  }, [userId, toast, queryClient])
}
