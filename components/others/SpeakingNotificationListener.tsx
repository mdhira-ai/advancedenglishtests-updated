'use client'
import { useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/notification-service'

export default function SpeakingNotificationListener() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    // Set up realtime subscription for speaking requests
    const speakingRequestsChannel = supabase
      .channel('global-speaking-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'speaking_requests',
          filter: `receiver_id=eq.${session.user.id}`
        },
        async (payload) => {
          console.log('New speaking request received:', payload)
          
          const newRequest = payload.new as any
          
          // Only show notification if the request is pending
          if (newRequest.status === 'pending') {
            // Fetch sender information
            try {
              const { data: senderData, error: fetchError } = await supabase
                .from('user')
                .select('name, email')
                .eq('id', newRequest.sender_id)
                .single()
              
              if (fetchError) {
                console.error('Error fetching sender data:', fetchError)
              }
              
              // Use name if available, otherwise email, otherwise fallback
              let senderName = senderData?.name || 
                               senderData?.email?.split('@')[0] || 
                               'Someone'
              
              // Capitalize first letter of name for better display
              senderName = senderName.charAt(0).toUpperCase() + senderName.slice(1).toLowerCase()
              
              // Show notification with buttons
              notificationService.showSpeakingRequest(
                senderName,
                newRequest.id,
                session.user.id
              )
              
            } catch (error) {
              console.error('Error fetching sender data:', error)
              // Show notification with fallback name
              notificationService.showSpeakingRequest(
                'Someone',
                newRequest.id,
                session.user.id
              )
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'speaking_requests',
          filter: `receiver_id=eq.${session.user.id}`
        },
        async (payload) => {
          console.log('Speaking request updated:', payload)
          
          const updatedRequest = payload.new as any
          
          // If request was cancelled or rejected, dismiss the notification
          if (updatedRequest.status === 'cancelled' || updatedRequest.status === 'rejected') {
            notificationService.dismissSpeakingRequest(updatedRequest.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(speakingRequestsChannel)
    }
  }, [session?.user?.id])

  // This component doesn't render anything visible
  return null
}