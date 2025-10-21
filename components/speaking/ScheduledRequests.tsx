'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User, 
  MessageSquare,
  Video,
  Timer,
  CalendarDays,
  RefreshCw,
  Send
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
// Email notifications handled via API routes

interface ScheduledRequest {
  id: string
  sender_id: string
  receiver_id: string
  scheduled_date: string
  scheduled_time: string
  scheduled_datetime: string
  timezone: string
  status: string
  message?: string
  created_at: string
  updated_at: string
  responded_at?: string
  sender_ready_at?: string
  receiver_ready_at?: string
  started_at?: string
  completed_at?: string
  room_code?: string
  expires_at?: string
  sender_name: string
  sender_email: string
  sender_picture?: string
  receiver_name: string
  receiver_email: string
  receiver_picture?: string
  other_user_name: string
  other_user_email: string
  other_user_picture?: string
  other_user_is_online?: boolean
  is_sender: boolean
  can_start_now: boolean
  both_ready: boolean
}

interface ScheduledRequestsProps {
  currentUserId: string
  onJoinRoom?: (roomCode: string) => void
  refreshTrigger?: number
  // Add presence data from speaking page
  allUsers?: ActiveUser[]
  currentUserInRoom?: boolean
  speakingRequests?: SpeakingRequest[]
  onCountChange?: (count: number) => void
}

interface ActiveUser {
  id: string
  first_name: string
  last_name: string
  gender: string
  avatar_url: string
  total_sessions: number
  likes_received: number
  avg_session_duration: number
  total_minutes: number
  is_online: boolean
  last_seen: string
  in_room?: boolean
  room_code?: string
  room_created_at?: string
}

interface SpeakingRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  created_at: string
  expires_at: string
}

export default function ScheduledRequests({ 
  currentUserId, 
  onJoinRoom,
  refreshTrigger = 0,
  allUsers = [],
  currentUserInRoom = false,
  speakingRequests = [],
  onCountChange
}: ScheduledRequestsProps) {
  const [scheduledRequests, setScheduledRequests] = useState<ScheduledRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

  // Utility function to check if user has active request (from speaking page logic)
  const hasActiveRequestWith = (userId: string) => {
    return speakingRequests.some(req => 
      (req.sender_id === currentUserId && req.receiver_id === userId && req.status === 'pending') ||
      (req.receiver_id === currentUserId && req.sender_id === userId && req.status === 'pending')
    )
  }

  // Utility function to check if user is unavailable (from speaking page logic)
  const isUserUnavailable = (userId: string) => {
    const user = allUsers.find(u => u.id === userId)
    if (!user) return true
    
    return !user.is_online || user.in_room || currentUserInRoom
  }

  // Separate function to check for scheduled sessions specifically
  const isUserUnavailableForScheduledSession = (userId: string, excludeActiveRequests: boolean = false) => {
    const user = allUsers.find(u => u.id === userId)
    if (!user) return true
    
    // For scheduled sessions, don't consider active speaking requests as unavailable
    // since scheduled sessions take priority
    if (excludeActiveRequests) {
      return !user.is_online || user.in_room || currentUserInRoom
    }
    
    return !user.is_online || user.in_room || currentUserInRoom || hasActiveRequestWith(user.id)
  }

  // Enhanced function to get user presence status
  const getUserPresenceStatus = (userId: string) => {
    const user = allUsers.find(u => u.id === userId)
    if (!user) {
      return {
        isOnline: false,
        inRoom: false,
        isUnavailable: true,
        statusText: 'User not found'
      }
    }

    const isOnline = user.is_online
    const inRoom = user.in_room || false
    const unavailable = isUserUnavailableForScheduledSession(userId, true) // Exclude active requests for scheduled sessions
    
    let statusText = ''
    if (!isOnline) {
      statusText = 'Offline'
    } else if (inRoom) {
      statusText = 'In Room'
    } else if (currentUserInRoom) {
      statusText = 'You are in room'
    } else {
      statusText = 'Available'
    }

    return {
      isOnline,
      inRoom,
      isUnavailable: unavailable,
      statusText,
      lastSeen: user.last_seen
    }
  }

  const fetchScheduledRequests = async () => {
    if (!currentUserId) return
    
    console.log('Fetching scheduled requests for user:', currentUserId)
    
    try {
      // Fetch scheduled requests where user is either sender or receiver
      const { data: requests, error } = await supabase
        .from('scheduled_speaking_requests')
        .select(`
          *,
          sender:sender_id(id, name, email, image, gender),
          receiver:receiver_id(id, name, email, image, gender)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching scheduled requests:', error)
        setError('Failed to fetch scheduled requests')
        return
      }

      console.log('Fetched scheduled requests:', requests?.length || 0, 'requests')
      
      // Transform the data to match the expected interface
      const transformedRequests = requests?.map((req: any) => ({
        ...req,
        is_sender: req.sender_id === currentUserId,
        other_user_name: req.sender_id === currentUserId ? req.receiver?.name : req.sender?.name,
        other_user_email: req.sender_id === currentUserId ? req.receiver?.email : req.sender?.email,
        other_user_picture: req.sender_id === currentUserId ? req.receiver?.image : req.sender?.image,
        sender_name: req.sender?.name,
        sender_email: req.sender?.email,
        sender_picture: req.sender?.image,
        receiver_name: req.receiver?.name,
        receiver_email: req.receiver?.email,
        receiver_picture: req.receiver?.image,
        can_start_now: req.status === 'accepted' && 
                      new Date(req.scheduled_datetime) <= new Date() && 
                      new Date(req.scheduled_datetime) > new Date(Date.now() - 30 * 60 * 1000), // within 30 min window
        both_ready: req.sender_ready_at && req.receiver_ready_at
      })) || []

      setScheduledRequests(transformedRequests)
      setError(null)
      
      // Calculate count of upcoming requests (pending + accepted future requests)
      if (onCountChange) {
        const pendingCount = transformedRequests.filter((req: ScheduledRequest) => req.status === 'pending').length
        const upcomingCount = transformedRequests.filter((req: ScheduledRequest) => 
          req.status === 'accepted' && new Date(req.scheduled_datetime) > new Date()
        ).length
        const totalCount = pendingCount + upcomingCount
        console.log('Updating count:', { pendingCount, upcomingCount, totalCount })
        onCountChange(totalCount)
      }
    } catch (err) {
      console.error('Error fetching scheduled requests:', err)
      setError('Failed to fetch scheduled requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledRequests()

    // Set up realtime subscription for scheduled_speaking_requests
    const channel = supabase
      .channel('scheduled-speaking-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_speaking_requests'
        },
        (payload) => {
          console.log('Realtime change in scheduled requests:', payload)
          
          // Check if the change affects current user
          const newRecord = payload.new as any
          const oldRecord = payload.old as any
          
          const isRelevant = (record: any) => 
            record && (record.sender_id === currentUserId || record.receiver_id === currentUserId)
          
          if (isRelevant(newRecord) || isRelevant(oldRecord)) {
            console.log('Relevant change detected, refetching requests...')
            // Refetch requests when there's any relevant change
            fetchScheduledRequests()
          }
        }
      )
      .subscribe((status) => {
        console.log('Scheduled requests subscription status:', status)
      })

    return () => {
      console.log('Cleaning up scheduled requests subscription')
      supabase.removeChannel(channel)
    }
  }, [currentUserId, refreshTrigger])

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'reject' | 'cancel') => {
    console.log('handleRequestResponse called with:', { requestId, action, currentUserId })
    
    if (!requestId || !currentUserId) {
      console.error('Missing required parameters:', { requestId, currentUserId })
      setError('Missing required parameters')
      return
    }

    // Validate requestId format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(requestId)) {
      console.error('Invalid requestId format:', requestId)
      setError('Invalid request ID format')
      return
    }
    
    setProcessingRequestId(requestId)
    
    try {
      // Find the request to get user details for email
      const request = scheduledRequests.find(req => req.id === requestId)
      if (!request) {
        setError('Request not found')
        return
      }

      // Map the action to the expected status
      let newStatus: string
      if (action === 'accept') {
        newStatus = 'accepted'
      } else if (action === 'reject') {
        newStatus = 'rejected'
      } else if (action === 'cancel') {
        newStatus = 'cancelled'
      } else {
        throw new Error('Invalid action')
      }
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        responded_at: new Date().toISOString()
      }

      console.log('Updating request with:', updateData)
      
      const { data, error } = await supabase
        .from('scheduled_speaking_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating request:', error)
        setError('Failed to respond to request')
        return
      }

      console.log('Request updated successfully:', data)

      // Immediately update local state for instant feedback
      setScheduledRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              responded_at: new Date().toISOString()
            } 
          : req
      ))

      // Get current user details for email
      const { data: currentUserData, error: userError } = await supabase
        .from('user')
        .select('name, email')
        .eq('id', currentUserId)
        .single()

      if (userError) {
        console.error('Error fetching current user data:', userError)
      }

      // Send email notification to the other party
      try {
        const otherUserId = request.is_sender ? request.receiver_id : request.sender_id
        
        // Get the actual email from user table
        const { data: otherUserData, error: otherUserError } = await supabase
          .from('user')
          .select('name, email')
          .eq('id', otherUserId)
          .single()

        if (otherUserError) {
          console.error('Error fetching other user data:', otherUserError)
        } else {
          const otherUserName = request.is_sender ? request.receiver_name : request.sender_name

          // Send email notification via API
          const emailResponse = await fetch('/api/email/response', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipientEmail: otherUserData.email,
              recipientName: otherUserData.name || otherUserName,
              actionPerformerName: currentUserData?.name || 'Someone',
              response: newStatus as 'accepted' | 'rejected' | 'cancelled',
              scheduledDate: request.scheduled_date,
              scheduledTime: request.scheduled_time,
              timezone: request.timezone
            })
          })
          
          if (emailResponse.ok) {
            console.log(`Email notification sent for ${action} action`)
          } else {
            console.error('Failed to send email notification')
          }
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
        // Don't fail the main operation if email fails
      }

      setError(null)
      // The realtime subscription will handle the refresh
    } catch (err) {
      console.error('Error responding to request:', err)
      setError('Failed to respond to request')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleMarkReady = async (requestId: string) => {
    setProcessingRequestId(requestId)
    
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // Determine which field to update based on current user
      const request = scheduledRequests.find(req => req.id === requestId)
      if (!request) {
        setError('Request not found')
        return
      }

      if (request.sender_id === currentUserId) {
        updateData.sender_ready_at = new Date().toISOString()
      } else {
        updateData.receiver_ready_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('scheduled_speaking_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single()

      if (error) {
        console.error('Error marking ready:', error)
        setError('Failed to mark as ready')
        return
      }

      console.log('Marked as ready successfully:', data)
      
      // Immediately update local state for instant feedback
      setScheduledRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              ...updateData,
              updated_at: new Date().toISOString()
            } 
          : req
      ))
      
      // Check if both users are ready and create room if needed
      const updatedRequest = { ...request, ...data }
      if (updatedRequest.sender_ready_at && updatedRequest.receiver_ready_at && !updatedRequest.room_code) {
        // Generate room code and update
        const roomCode = Math.random().toString(36).substring(2, 15)
        const { data: roomData, error: roomError } = await supabase
          .from('scheduled_speaking_requests')
          .update({
            room_code: roomCode,
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', requestId)
          .select()
          .single()

        if (!roomError && onJoinRoom) {
          onJoinRoom(roomCode)
        }
      }

      setError(null)
    } catch (err) {
      console.error('Error marking ready:', err)
      setError('Failed to mark as ready')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleConnectNow = async (otherUserId: string) => {
    setProcessingRequestId(otherUserId)
    
    try {
      // Create an immediate speaking request using Supabase
      const { data, error } = await supabase
        .from('speaking_requests')
        .insert({
          sender_id: currentUserId,
          receiver_id: otherUserId,
          status: 'pending',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating speaking request:', error)
        setError('Failed to send request')
        return
      }

      console.log('Speaking request created successfully:', data)
      setError(null)
    } catch (err) {
      console.error('Error sending connect now request:', err)
      setError('Failed to send request')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelled</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Completed</Badge>
      case 'expired':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDateTime = (dateStr: string, timeStr: string, timezone: string) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`)
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
        timezone: timezone
      }
    } catch (error) {
      return { date: dateStr, time: timeStr, timezone }
    }
  }

  const getTimeUntilSession = (scheduledDatetime: string) => {
    const sessionTime = new Date(scheduledDatetime)
    const now = new Date()
    const diffMs = sessionTime.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 0) {
      return 'Session time has passed'
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes`
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(diffMinutes / 1440)
      return `${days} day${days > 1 ? 's' : ''}`
    }
  }

  const isSessionTimeArrived = (scheduledDatetime: string) => {
    const sessionTime = new Date(scheduledDatetime)
    const now = new Date()
    const diffMs = sessionTime.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    // Session time has arrived if it's within 5 minutes before or after scheduled time
    return diffMinutes <= 10 && diffMinutes >= -30
  }

  const isOtherUserActive = (request: ScheduledRequest) => {
    const otherUserId = request.is_sender ? request.receiver_id : request.sender_id
    const user = allUsers.find(u => u.id === otherUserId)
    
    if (!user) return false
    
    // For scheduled sessions, user is active if they're online, not in room, 
    // and current user is not in room
    return user.is_online && !user.in_room && !currentUserInRoom
  }

  const shouldShowConnectNow = (request: ScheduledRequest) => {
    const otherUserId = request.is_sender ? request.receiver_id : request.sender_id
    const user = allUsers.find(u => u.id === otherUserId)
    
    if (!user) return false
    
    return (
      request.status === 'accepted' && 
      isSessionTimeArrived(request.scheduled_datetime) && 
      user.is_online && 
      !user.in_room && // Other user should not be in a room
      !currentUserInRoom && // Current user should not be in a room
      !request.can_start_now && // Only show if not already showing "Join Session"
      !hasActiveRequestWith(otherUserId) // No active request between users
    )
  }

  const groupRequestsByStatus = () => {
    const groups = {
      upcoming: scheduledRequests.filter(req => 
        req.status === 'accepted' && new Date(req.scheduled_datetime) > new Date()
      ),
      pending: scheduledRequests.filter(req => req.status === 'pending'),
      past: scheduledRequests.filter(req => 
        ['completed', 'rejected', 'cancelled', 'expired'].includes(req.status) ||
        (req.status === 'accepted' && new Date(req.scheduled_datetime) <= new Date())
      )
    }
    return groups
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">Loading scheduled sessions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchScheduledRequests}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  const groups = groupRequestsByStatus()

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {groups.pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            <span>Pending Requests ({groups.pending.length})</span>
          </h3>
          
          {groups.pending.map((request) => {
            const { date, time, timezone } = formatDateTime(
              request.scheduled_date, 
              request.scheduled_time, 
              request.timezone
            )
            
            return (
              <Card key={request.id} className="border-l-4 p-0 border-l-yellow-500">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-gray-200 flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 leading-tight">
                          {request.is_sender ? `Request sent to ${request.other_user_name}` : `Request from ${request.other_user_name}`}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{time} ({timezone})</span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                          {getStatusBadge(request.status)}
                          {/* Desktop buttons - shown after Pending badge on larger screens */}
                          <div className="hidden sm:flex space-x-2">
                            {!request.is_sender && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleRequestResponse(request.id, 'accept')}
                                  disabled={processingRequestId === request.id}
                                  className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-6"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRequestResponse(request.id, 'reject')}
                                  disabled={processingRequestId === request.id}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.is_sender && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequestResponse(request.id, 'cancel')}
                                disabled={processingRequestId === request.id}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile buttons - shown at bottom on smaller screens */}
                    <div className="flex flex-col sm:hidden space-y-2">
                      {!request.is_sender && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleRequestResponse(request.id, 'accept')}
                            disabled={processingRequestId === request.id}
                            className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestResponse(request.id, 'reject')}
                            disabled={processingRequestId === request.id}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {request.is_sender && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestResponse(request.id, 'cancel')}
                          disabled={processingRequestId === request.id}
                          className="text-xs px-2 py-1 h-7"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <div className="flex items-start space-x-1">
                        <MessageSquare className="h-4 w-4 mt-0.5 text-gray-500" />
                        <span>{request.message}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upcoming Sessions */}
      {groups.upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span>Upcoming Sessions ({groups.upcoming.length})</span>
          </h3>
          
          {groups.upcoming.map((request) => {
            const { date, time, timezone } = formatDateTime(
              request.scheduled_date, 
              request.scheduled_time, 
              request.timezone
            )
            const timeUntil = getTimeUntilSession(request.scheduled_datetime)
            
            return (
              <Card key={request.id} className="border-l-4 p-0 border-l-blue-500">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-gray-200 flex-shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
                          <span className="leading-tight">Session with {request.other_user_name}</span>
                          {(() => {
                            const otherUserId = request.is_sender ? request.receiver_id : request.sender_id
                            const presenceStatus = getUserPresenceStatus(otherUserId)
                            
                            if (presenceStatus.isOnline) {
                              return (
                                <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-green-600 font-medium">
                                    {presenceStatus.inRoom ? 'Online (In Room)' : 'Online'}
                                  </span>
                                </div>
                              )
                            } else {
                              return (
                                <div className="flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-xs text-gray-500">Offline</span>
                                </div>
                              )
                            }
                          })()}
                        </h4>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="truncate">{time} ({timezone})</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0 mt-2">
                          {getStatusBadge(request.status)}
                          <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600">
                            <Timer className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>
                              {isSessionTimeArrived(request.scheduled_datetime) 
                                ? <span className="text-orange-600 font-medium">Session time!</span>
                                : `in ${timeUntil}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-3">
                      {request.can_start_now && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkReady(request.id)}
                          disabled={processingRequestId === request.id}
                          className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 py-1 h-7 sm:h-8"
                        >
                          <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {processingRequestId === request.id ? 'Joining...' : 'Join Session'}
                        </Button>
                      )}
                      
                      {shouldShowConnectNow(request) && (
                        <Button
                          size="sm"
                          onClick={() => handleConnectNow(request.is_sender ? request.receiver_id : request.sender_id)}
                          disabled={processingRequestId === (request.is_sender ? request.receiver_id : request.sender_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm px-2 py-1 h-7 sm:h-8"
                        >
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {processingRequestId === (request.is_sender ? request.receiver_id : request.sender_id) ? 'Connecting...' : 'Connect Now'}
                        </Button>
                      )}
                      
                      {request.is_sender && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestResponse(request.id, 'cancel')}
                          disabled={processingRequestId === request.id}
                          className="text-xs sm:text-sm px-2 py-1 h-7 sm:h-8"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs sm:text-sm text-gray-700">
                      <div className="flex items-start space-x-1">
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                        <span className="break-words">{request.message}</span>
                      </div>
                    </div>
                  )}
                  
                  {(() => {
                    const otherUserId = request.is_sender ? request.receiver_id : request.sender_id
                    const presenceStatus = getUserPresenceStatus(otherUserId)
                    
                    // Check if session time has arrived
                    if (!isSessionTimeArrived(request.scheduled_datetime)) {
                      return null
                    }

                    // First priority: Show success message when both users are ready to connect
                    if (shouldShowConnectNow(request)) {
                      return (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                          <div className="flex items-start space-x-1">
                            <Clock className="h-4 w-4 mt-0.5 text-blue-500" />
                            <span>
                              Perfect timing! {request.other_user_name} is online and available. 
                              Click "Connect Now" to start your speaking session immediately.
                            </span>
                          </div>
                        </div>
                      )
                    }

                    // Second priority: If both users can start now (ready button), don't show unavailable message
                    if (request.can_start_now) {
                      return null
                    }

                    // Third priority: Show specific unavailability reasons only when truly unavailable
                    let statusMessage = ''
                    let showUnavailableMessage = false

                    if (!presenceStatus.isOnline) {
                      statusMessage = `${request.other_user_name} is currently offline.`
                      showUnavailableMessage = true
                    } else if (presenceStatus.inRoom) {
                      statusMessage = `${request.other_user_name} is currently in another room.`
                      showUnavailableMessage = true
                    } else if (currentUserInRoom) {
                      statusMessage = `You are currently in another room.`
                      showUnavailableMessage = true
                    } else if (hasActiveRequestWith(otherUserId)) {
                      statusMessage = `There is already an active speaking request with ${request.other_user_name}.`
                      showUnavailableMessage = true
                    }

                    // Only show unavailable message if there's a specific reason
                    if (showUnavailableMessage) {
                      return (
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                          <div className="flex items-start space-x-1">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500" />
                            <span>
                              Session time has arrived, but {statusMessage}
                              {!presenceStatus.isOnline && ' The "Connect Now" button will appear when they come online.'}
                            </span>
                          </div>
                        </div>
                      )
                    }
                    
                    return null
                  })()}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Past Sessions */}
      {groups.past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            <span>Past Sessions ({groups.past.length})</span>
          </h3>
          
          {groups.past.map((request) => {
            const { date, time, timezone } = formatDateTime(
              request.scheduled_date, 
              request.scheduled_time, 
              request.timezone
            )
            
            return (
              <Card key={request.id} className="border-l-4 p-0 border-l-gray-300">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-gray-200 flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">
                        Session with {request.other_user_name}
                      </h4>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs text-gray-500 mt-1">
                        <span className="truncate">{date}</span>
                        <span className="truncate">{time} ({timezone})</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {scheduledRequests.length === 0 && (
        <div className="text-center py-6 sm:py-8">
          <CalendarDays className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Scheduled Sessions</h3>
          <p className="text-sm sm:text-base text-gray-500 px-4">
            Schedule speaking sessions with other users to practice together at specific times.
          </p>
        </div>
      )}
    </div>
  )
}
