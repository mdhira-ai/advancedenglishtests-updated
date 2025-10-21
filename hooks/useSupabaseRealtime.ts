'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseSupabaseRealtimeProps {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema?: string
  filter?: string
  enabled?: boolean
}

interface RealtimeData {
  payload: any | null
  error: string | null
  isConnected: boolean
}

export const useSupabaseRealtime = ({
  table,
  event = '*',
  schema = 'public',
  filter,
  enabled = true
}: UseSupabaseRealtimeProps) => {
  const [data, setData] = useState<RealtimeData>({
    payload: null,
    error: null,
    isConnected: false
  })

  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const channelName = `realtime_${table}_${Date.now()}`
    
    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
          ...(filter && { filter })
        },
        (payload: any) => {
          console.log(`Realtime update for ${table}:`, payload)
          setData(prev => ({
            ...prev,
            payload,
            error: null
          }))
        }
      )
      .subscribe((status: string) => {
        console.log(`Subscription status for ${table}:`, status)
        setData(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
          error: status === 'CHANNEL_ERROR' ? 'Connection error' : null
        }))
      })

    setChannel(realtimeChannel)

    return () => {
      console.log(`Cleaning up subscription for ${table}`)
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [table, event, schema, filter, enabled])

  return data
}

// Specialized hooks for specific tables
export const useContactFormRealtime = (userId?: string) => {
  return useSupabaseRealtime({
    table: 'contact_form_submissions',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId
  })
}

export const useNewsletterRealtime = (userId?: string) => {
  return useSupabaseRealtime({
    table: 'newsletter_subscriptions',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId
  })
}

// Hook for admin to monitor all submissions
export const useAdminContactRealtime = () => {
  return useSupabaseRealtime({
    table: 'contact_form_submissions',
    event: 'INSERT'
  })
}

export const useAdminNewsletterRealtime = () => {
  return useSupabaseRealtime({
    table: 'newsletter_subscriptions',
    event: 'INSERT'
  })
}