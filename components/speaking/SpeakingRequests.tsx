'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { X, Check, Clock, User, UserCheck, Send, Inbox } from 'lucide-react'
import React from 'react'
import { createRoomAndAddUsers } from '@/lib/room-management'
import { useRouter } from 'next/navigation'

interface SpeakingRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  expires_at: string
  sender_profile?: {
    id: string
    name: string
    gender: string
  }
  receiver_profile?: {
    id: string
    name: string
    gender: string
  }
}

interface SpeakingRequestsProps {
  currentUserId: string
  allUsers: any[]
  onRequestCountChange?: (incoming: number, outgoing: number) => void
  onRoomJoin?: (roomCode: string) => void
}

export default function SpeakingRequests({ 
  currentUserId, 
  allUsers,
  onRequestCountChange,
  onRoomJoin 
}: SpeakingRequestsProps) {
  const [requests, setRequests] = useState<SpeakingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const router = useRouter()

  // Helper function to check if a user is currently in a room
  const isUserInRoom = (userId: string): boolean => {
    const user = allUsers.find(u => u.userId === userId)
    return user?.in_room || false
  }

  // Helper function to check if either user in a request is in a room
  const isEitherUserInRoom = (request: SpeakingRequest): boolean => {
    return isUserInRoom(request.sender_id) || isUserInRoom(request.receiver_id)
  }

  // Fetch requests
  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('speaking_requests')
        .select(`
          *,
          sender_profile:sender_id(id, name, gender),
          receiver_profile:receiver_id(id, name, gender)
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching requests:', error)
        return
      }

      setRequests(data || [])
      
      // Update counts
      if (onRequestCountChange) {
        const incoming = data?.filter(req => req.receiver_id === currentUserId).length || 0
        const outgoing = data?.filter(req => req.sender_id === currentUserId).length || 0
        onRequestCountChange(incoming, outgoing)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Send a speaking request
  const sendRequest = async (receiverId: string) => {
    if (!currentUserId || receiverId === currentUserId) return

    // Check if there's already a pending request between these users
    const existingRequest = requests.find(req => 
      (req.sender_id === currentUserId && req.receiver_id === receiverId) ||
      (req.sender_id === receiverId && req.receiver_id === currentUserId)
    )

    if (existingRequest) {
      console.error('There is already a pending request between you and this user')
      return
    }

    setProcessingRequestId(receiverId)
    
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      
      const { error } = await supabase
        .from('speaking_requests')
        .insert({
          sender_id: currentUserId,
          receiver_id: receiverId,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })

      if (error) {
        console.error('Error sending request:', error)
        console.error('Failed to send request')
        return
      }

      console.log('Speaking request sent!')
    } catch (error) {
      console.error('Error sending request:', error)
      console.error('Failed to send request')
    } finally {
      setProcessingRequestId(null)
    }
  }

  // Update request status
  const updateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    setProcessingRequestId(requestId)
    
    try {
      // Find the request to get participant details
      const request = requests.find(req => req.id === requestId)
      if (!request) {
        console.error('Request not found')
        return
      }

      // If accepting a request, create room and redirect both users
      if (status === 'accepted') {
        const senderId = request.sender_id
        const receiverId = request.receiver_id
        
        // Create room and add both users
        const { roomCode, error: roomError } = await createRoomAndAddUsers(senderId, receiverId)
        
        if (roomError || !roomCode) {
          console.error('Failed to create room:', roomError)
          return
        }

        // Update request status to accepted
        const { error } = await supabase
          .from('speaking_requests')
          .update({ status })
          .eq('id', requestId)

        if (error) {
          console.error('Error updating request:', error)
          return
        }

        // Redirect current user to room
        router.push(`/speaking/room/${roomCode}`)
        
        // Notify the other user via callback if provided
        if (onRoomJoin) {
          onRoomJoin(roomCode)
        }

        console.log(`Request accepted and room ${roomCode} created`)
      } else {
        // For reject/cancel, just update status
        const { error } = await supabase
          .from('speaking_requests')
          .update({ status })
          .eq('id', requestId)

        if (error) {
          console.error('Error updating request:', error)
          return
        }

        const actionText = status === 'rejected' ? 'rejected' : 'cancelled'
        console.log(`Request ${actionText}`)
      }
    } catch (error) {
      console.error('Error updating request:', error)
    } finally {
      setProcessingRequestId(null)
    }
  }

  // Check if user has pending request with another user
  const hasPendingRequestWith = (userId: string) => {
    return requests.some(req => 
      (req.sender_id === currentUserId && req.receiver_id === userId) ||
      (req.sender_id === userId && req.receiver_id === currentUserId)
    )
  }

  // Get pending request with user
  const getPendingRequestWith = (userId: string) => {
    return requests.find(req => 
      (req.sender_id === currentUserId && req.receiver_id === userId) ||
      (req.sender_id === userId && req.receiver_id === currentUserId)
    )
  }

  // Get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'female':
        return <UserCheck className="h-4 w-4 text-pink-600" />
      case 'male':
        return <User className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  // Setup realtime subscription
  useEffect(() => {
    if (!currentUserId) return

    fetchRequests()

    const channel = supabase
      .channel('speaking_requests_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'speaking_requests'
        },
        (payload) => {
          console.log('Request change received:', payload)
          // Only refetch if the change involves the current user
          const newData = payload.new as any
          const oldData = payload.old as any
          
          if ((newData?.sender_id === currentUserId || newData?.receiver_id === currentUserId) ||
              (oldData?.sender_id === currentUserId || oldData?.receiver_id === currentUserId)) {
            fetchRequests() // Refetch to get updated data with profiles
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const incomingRequests = requests.filter(req => req.receiver_id === currentUserId)
  const outgoingRequests = requests.filter(req => req.sender_id === currentUserId)

  // Get user display name
  const getUserDisplayName = (user: any) => {
    if (user?.name) return user.name
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`
    if (user?.first_name) return user.first_name
    return 'Unknown User'
  }

  return {
    requests,
    incomingRequests,
    outgoingRequests,
    sendRequest,
    updateRequestStatus,
    hasPendingRequestWith,
    getPendingRequestWith,
    getGenderIcon,
    getUserDisplayName,
    isLoading,
    processingRequestId,
    isUserInRoom,
    isEitherUserInRoom
  }
}

// Incoming Requests Modal Component
export function IncomingRequestsModal({ 
  isOpen, 
  onClose, 
  requests, 
  updateRequestStatus, 
  getGenderIcon,
  getUserDisplayName,
  processingRequestId,
  isEitherUserInRoom
}: {
  isOpen: boolean
  onClose: () => void
  requests: SpeakingRequest[]
  updateRequestStatus: (id: string, status: 'accepted' | 'rejected') => void
  getGenderIcon: (gender: string) => React.ReactElement
  getUserDisplayName: (user: any) => string
  processingRequestId: string | null
  isEitherUserInRoom?: (request: SpeakingRequest) => boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-3 lg:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Inbox className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold">Incoming Requests</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No incoming requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getGenderIcon(request.sender_profile?.gender || '')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {getUserDisplayName(request.sender_profile)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {request.sender_profile?.gender}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'rejected')}
                        disabled={processingRequestId === request.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(request.id, 'accepted')}
                        disabled={processingRequestId === request.id || (isEitherUserInRoom ? isEitherUserInRoom(request) : false)}
                        className={`${
                          isEitherUserInRoom && isEitherUserInRoom(request)
                            ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={isEitherUserInRoom && isEitherUserInRoom(request) ? 'Cannot accept - one user is currently in a room' : ''}
                      >
                        {isEitherUserInRoom && isEitherUserInRoom(request) ? (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Busy
                          </span>
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Outgoing Requests Modal Component
export function OutgoingRequestsModal({ 
  isOpen, 
  onClose, 
  requests, 
  updateRequestStatus, 
  getGenderIcon,
  getUserDisplayName,
  processingRequestId 
}: {
  isOpen: boolean
  onClose: () => void
  requests: SpeakingRequest[]
  updateRequestStatus: (id: string, status: 'cancelled') => void
  getGenderIcon: (gender: string) => React.ReactElement
  getUserDisplayName: (user: any) => string
  processingRequestId: string | null
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-3 lg:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Sent Requests</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No sent requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getGenderIcon(request.receiver_profile?.gender || '')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {getUserDisplayName(request.receiver_profile)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {request.receiver_profile?.gender}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestStatus(request.id, 'cancelled')}
                        disabled={processingRequestId === request.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}