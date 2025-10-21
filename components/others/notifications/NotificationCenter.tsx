'use client'

import React, { useEffect, useState } from 'react'
import { X, Bell, User, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface NotificationItem {
  id: string
  type: 'incoming_request' | 'request_accepted' | 'request_declined' | 'request_cancelled'
  message: string
  timestamp: string
  requestId?: string
  userId?: string
  userName?: string
}

interface NotificationCenterProps {
  notifications: NotificationItem[]
  onClearNotification: (id: string) => void
  className?: string
}

export function NotificationCenter({ 
  notifications, 
  onClearNotification,
  className = '' 
}: NotificationCenterProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationItem[]>([])

  // Show notifications with auto-hide for certain types
  useEffect(() => {
    setVisibleNotifications(notifications.slice(0, 5)) // Show max 5 notifications
  }, [notifications])

  // Auto-hide all notifications after 10 seconds
  useEffect(() => {
    const timers: NodeJS.Timeout[] = []
    
    visibleNotifications.forEach(notification => {
      const timer = setTimeout(() => {
        onClearNotification(notification.id)
      }, 10000) // 10 seconds
      timers.push(timer)
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [visibleNotifications, onClearNotification])

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'incoming_request':
        return <Bell className="h-5 w-5 text-blue-600" />
      case 'request_accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'request_declined':
      case 'request_cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <User className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'incoming_request':
        return 'border-l-blue-500 bg-blue-50'
      case 'request_accepted':
        return 'border-l-green-500 bg-green-50'
      case 'request_declined':
      case 'request_cancelled':
        return 'border-l-red-500 bg-red-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 max-w-sm ${className}`}>
      {visibleNotifications.map((notification) => (
        <Card 
          key={notification.id}
          className={`border-l-4 ${getNotificationColor(notification.type)} shadow-lg gap-0 p-0 animate-in slide-in-from-right-full duration-300`}
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClearNotification(notification.id)}
                className="h-6 w-6 p-0 hover:bg-gray-200 ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Notification badge for sidebar items
interface NotificationBadgeProps {
  count: number
  className?: string
}

export function NotificationBadge({ count, className = '' }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <div className={`
      inline-flex items-center justify-center 
      min-w-[20px] h-5 px-1.5 
      bg-red-500 text-white text-xs font-semibold 
      rounded-full
      animate-pulse
      ${className}
    `}>
      {count > 99 ? '99+' : count}
    </div>
  )
}

export default NotificationCenter