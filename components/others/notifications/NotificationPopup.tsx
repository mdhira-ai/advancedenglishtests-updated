'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Clock, Mic, X, User, CalendarDays, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface NotificationItem {
  id: string
  type: 'speaking' | 'scheduled'
  sender_id: string
  sender_first_name?: string
  sender_last_name?: string
  sender_name?: string
  sender_picture?: string
  avatar_url?: string
  created_at: string
  scheduled_date?: string
  scheduled_time?: string
  message?: string
  status: string
}

interface UpcomingSession {
  id: string
  sender_id: string
  receiver_id: string
  scheduled_date: string
  scheduled_time: string
  scheduled_datetime: string
  timezone: string
  status: string
  message?: string
  other_user_name: string
  other_user_email: string
  other_user_picture?: string
  is_sender: boolean
  can_start_now: boolean
}

interface NotificationPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPopup({ isOpen, onClose }: NotificationPopupProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [loading, setLoading] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, onClose])

  // Fetch notifications when popup opens
 

 
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatScheduledTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`)
    return dateTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getSenderName = (notification: NotificationItem) => {
    if (notification.sender_name) return notification.sender_name
    if (notification.sender_first_name || notification.sender_last_name) {
      return `${notification.sender_first_name || ''} ${notification.sender_last_name || ''}`.trim()
    }
    return 'Unknown User'
  }

  const getSenderAvatar = (notification: NotificationItem) => {
    return notification.sender_picture || notification.avatar_url || ''
  }

  const formatUpcomingSessionTime = (scheduledDatetime: string) => {
    const sessionTime = new Date(scheduledDatetime)
    const now = new Date()
    const diffMs = sessionTime.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    // Format the date and time
    const timeString = sessionTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    
    // Add time until session
    if (diffMinutes < 0) {
      return { timeString, timeUntil: 'Session time has passed', canStartSoon: false }
    } else if (diffMinutes <= 10) {
      return { timeString, timeUntil: 'Starting now!', canStartSoon: true }
    } else if (diffMinutes < 60) {
      return { timeString, timeUntil: `in ${diffMinutes} minutes`, canStartSoon: false }
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      return { timeString, timeUntil: `in ${hours} hour${hours > 1 ? 's' : ''}`, canStartSoon: false }
    } else {
      const days = Math.floor(diffMinutes / 1440)
      return { timeString, timeUntil: `in ${days} day${days > 1 ? 's' : ''}`, canStartSoon: false }
    }
  }

  const handleGoToSpeaking = () => {
    onClose()
    router.push('/speaking')
  }

  const handleNotificationClick = () => {
    handleGoToSpeaking()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm z-50 flex items-start justify-center pt-4 sm:pt-16 px-4">
      <div 
        ref={popupRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-brand-purple" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {(notifications.length + upcomingSessions.length) > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {notifications.length + upcomingSessions.length}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-64 sm:max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-purple"></div>
            </div>
          ) : (notifications.length === 0 && upcomingSessions.length === 0) ? (
            <div className="text-center py-8 px-4">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No new notifications</p>
              <p className="text-gray-400 text-xs mt-1">
                Speaking requests and scheduled sessions will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Upcoming Sessions Section */}
              {upcomingSessions.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Upcoming Sessions</span>
                    </div>
                  </div>
                  {upcomingSessions.map((session) => {
                    const { timeString, timeUntil, canStartSoon } = formatUpcomingSessionTime(session.scheduled_datetime)
                    return (
                      <div
                        key={session.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={handleNotificationClick}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <Video className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-blue-600 uppercase tracking-wide font-medium">
                                Session {canStartSoon ? '• Ready to Start!' : ''}
                              </span>
                            </div>

                            <p className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">
                                {session.other_user_name}
                              </span>
                              <span className="text-gray-600 ml-1">• Speaking Practice</span>
                            </p>

                            <p className="text-xs text-gray-600 mb-1">
                              📅 {timeString}
                            </p>

                            <p className="text-xs text-gray-500">
                              {canStartSoon ? (
                                <span className="text-green-600 font-medium">🟢 {timeUntil}</span>
                              ) : (
                                <span>{timeUntil}</span>
                              )}
                            </p>

                            {session.message && (
                              <p className="text-xs text-gray-600 mt-1 italic">
                                "{session.message}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {/* Notifications Section */}
              {notifications.length > 0 && (
                <>
                  {upcomingSessions.length > 0 && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Recent Notifications</span>
                      </div>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={handleNotificationClick}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center border">
                            <User className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {notification.type === 'speaking' ? (
                              <Mic className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-green-500" />
                            )}
                            <span className="text-xs text-gray-500 uppercase tracking-wide">
                              {notification.type === 'speaking' ? 'Speaking Request' : 'Scheduled Session'}
                            </span>
                          </div>

                          <p className="text-sm text-gray-900 mb-1">
                            <span className="font-medium">
                              {getSenderName(notification)}
                            </span>
                            {notification.type === 'speaking' 
                              ? ' wants to practice speaking with you'
                              : ' scheduled a speaking session with you'
                            }
                          </p>

                          {notification.type === 'scheduled' && notification.scheduled_date && notification.scheduled_time && (
                            <p className="text-xs text-gray-600 mb-1">
                              📅 {formatScheduledTime(notification.scheduled_date, notification.scheduled_time)}
                            </p>
                          )}

                          {notification.message && (
                            <p className="text-xs text-gray-600 mb-1 italic">
                              "{notification.message}"
                            </p>
                          )}

                          <p className="text-xs text-gray-500">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <p className='text-xs text-gray-500 text-center my-2'>Please visit the speaking page to manage your requests and sessions.</p>
         
        </div>
      </div>
    </div>
  )
}
