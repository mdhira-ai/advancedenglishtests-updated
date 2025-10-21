'use client'

import React from 'react'

import NotificationCenter from '@/components/others/notifications/NotificationCenter'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'

export default function NotificationHandler() {
  const { data: session } = useSession()
  const router = useRouter()
  const currentUserId = session?.user?.id || null

  const getAuthHeaders = React.useCallback(async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    // Better Auth uses session cookies automatically
    // No additional headers needed
    
    return headers
  }, [session])

  const handleJoinRoom = (roomCode: string) => {
    router.push(`/speaking/room/${roomCode}`)
  }

  // For now, return empty notifications until proper hook is implemented
  const notifications: any[] = []
  const clearNotification = (id: string) => {
    // TODO: Implement notification clearing
    console.log('Clear notification:', id)
  }

  return (
    <NotificationCenter
      notifications={notifications}
      onClearNotification={clearNotification}
    />
  )
}
