import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/lib/auth-client'

export interface RoomData {
  id: string
  room_code: string
  creator_id: string
  status: string
  created_at: string
  creator: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string
    gender: string
  }
  // Keep user1/user2 for backward compatibility, but map from creator and participants
  user1_id: string
  user2_id: string
  user1: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string
    gender: string
  }
  user2: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string
    gender: string
  }
}

export interface RoomParticipant {
  id: string
  first_name: string
  last_name: string
  avatar_url: string
  gender: string
  role: 'original' | 'additional'
  joined_at: string
  is_online: boolean
}

export interface ParticipantLike {
  hasLiked: boolean
  likesCount: number
  isLoading: boolean
}

export function useSpeakingRoom(roomCode: string) {
  const { data: session } = useSession()
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [participantLikes, setParticipantLikes] = useState<Record<string, ParticipantLike>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  const currentUserId = session?.user?.id

  // Fetch initial room data
  const fetchRoomData = useCallback(async () => {
    if (!currentUserId || !roomCode) {
      console.log('useSpeakingRoom: Missing data', { currentUserId, roomCode })
      return
    }

    try {
      console.log('useSpeakingRoom: Fetching room data for:', { roomCode, currentUserId })
      setIsLoading(true)
      
      // Get room with creator and participants data using correct schema
      const { data: room, error: roomError } = await supabase
        .from('speaking_rooms')
        .select(`
          id,
          room_code,
          creator_id,
          status,
          created_at,
          creator:user!creator_id(
            id,
            name,
            gender,
            image
          ),
          participants:speaking_room_participants(
            user_id,
            role,
            is_online,
            left_at,
            user:user(
              id,
              name,
              gender,
              image
            )
          )
        `)
        .eq('room_code', roomCode)
        .single()

      if (roomError) {
        console.error('useSpeakingRoom: Room lookup error:', {
          error: roomError,
          roomCode,
          userId: currentUserId,
          errorCode: roomError.code,
          errorMessage: roomError.message,
          errorDetails: roomError.details
        })
        setError('Room not found or has ended.')
        setIsAuthorized(false)
        return
      }

      if (!room) {
        console.log('useSpeakingRoom: Room not found')
        setError('Room not found or has ended.')
        setIsAuthorized(false)
        return
      }

      console.log('useSpeakingRoom: Room found:', { 
        roomCode: room.room_code, 
        status: room.status, 
        creatorId: room.creator_id,
        participantCount: room.participants?.length || 0
      })

      // Check if room has ended
      if (room.status === 'ended') {
        console.log('useSpeakingRoom: Room has ended')
        setError('Room has ended.')
        setIsAuthorized(false)
        return
      }

      // Check if user is authorized (either creator or active participant)
      const isCreator = room.creator_id === currentUserId
      let isParticipant = false
      
      if (!isCreator) {
        // Check if user is an active participant
        const activeParticipant = room.participants?.find(
          (p: any) => p.user_id === currentUserId && p.left_at === null
        )
        isParticipant = !!activeParticipant
      }

      console.log('useSpeakingRoom: Authorization check:', { 
        isCreator, 
        isParticipant, 
        currentUserId,
        authorized: isCreator || isParticipant
      })

      if (!isCreator && !isParticipant) {
        console.log('useSpeakingRoom: User not authorized')
        setError('You are not authorized to access this room.')
        setIsAuthorized(false)
        return
      }

      // Get active participants for backward compatibility
      const activeParticipants = room.participants?.filter((p: any) => p.left_at === null) || []
      
      // Find the "other" user for backward compatibility (first active participant who isn't the creator)
      let otherUser = null
      if (isCreator) {
        // If current user is creator, find first other participant
        const otherParticipant = activeParticipants.find((p: any) => p.user_id !== currentUserId)
        if (otherParticipant && otherParticipant.user) {
          otherUser = {
            id: (otherParticipant.user as any)?.id,
            first_name: (otherParticipant.user as any)?.name?.split(' ')[0] || '',
            last_name: (otherParticipant.user as any)?.name?.split(' ').slice(1).join(' ') || '',
            avatar_url: (otherParticipant.user as any)?.image || '',
            gender: (otherParticipant.user as any)?.gender || 'other'
          }
        }
      } else {
        // If current user is participant, the "other" user is the creator
        otherUser = {
          id: (room.creator as any)?.id,
          first_name: (room.creator as any)?.name?.split(' ')[0] || '',
          last_name: (room.creator as any)?.name?.split(' ').slice(1).join(' ') || '',
          avatar_url: (room.creator as any)?.image || '',
          gender: (room.creator as any)?.gender || 'other'
        }
      }

      // Create current user info
      const currentUserInfo = isCreator ? {
        id: (room.creator as any)?.id,
        first_name: (room.creator as any)?.name?.split(' ')[0] || '',
        last_name: (room.creator as any)?.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: (room.creator as any)?.image || '',
        gender: (room.creator as any)?.gender || 'other'
      } : {
        id: currentUserId,
        first_name: '', // Will be filled by participants data
        last_name: '',
        avatar_url: '',
        gender: 'other'
      }

      // If current user is participant, get their info from participants data
      if (!isCreator) {
        const currentParticipant = activeParticipants.find((p: any) => p.user_id === currentUserId)
        if (currentParticipant) {
          currentUserInfo.first_name = (currentParticipant.user as any)?.name?.split(' ')[0] || ''
          currentUserInfo.last_name = (currentParticipant.user as any)?.name?.split(' ').slice(1).join(' ') || ''
          currentUserInfo.avatar_url = (currentParticipant.user as any)?.image || ''
          currentUserInfo.gender = (currentParticipant.user as any)?.gender || 'other'
        }
      }

      // Transform the data to match the expected format (maintain backward compatibility)
      const transformedRoom: RoomData = {
        id: room.id,
        room_code: room.room_code,
        creator_id: room.creator_id,
        status: room.status,
        created_at: room.created_at,
        creator: {
          id: (room.creator as any)?.id,
          first_name: (room.creator as any)?.name?.split(' ')[0] || '',
          last_name: (room.creator as any)?.name?.split(' ').slice(1).join(' ') || '',
          avatar_url: (room.creator as any)?.image || '',
          gender: (room.creator as any)?.gender || 'other'
        },
        // For backward compatibility, map to user1/user2 structure
        user1_id: isCreator ? currentUserId : room.creator_id,
        user2_id: otherUser?.id || '',
        user1: isCreator ? currentUserInfo : {
          id: (room.creator as any)?.id,
          first_name: (room.creator as any)?.name?.split(' ')[0] || '',
          last_name: (room.creator as any)?.name?.split(' ').slice(1).join(' ') || '',
          avatar_url: (room.creator as any)?.image || '',
          gender: (room.creator as any)?.gender || 'other'
        },
        user2: otherUser || {
          id: '',
          first_name: 'Waiting',
          last_name: 'for participant...',
          avatar_url: '',
          gender: 'other'
        }
      }

      setRoomData(transformedRoom)
      setIsAuthorized(true)
      setError(null)

    } catch (error) {
      console.error('Error fetching room data:', error)
      setError('Failed to load room. Please try again.')
      setIsAuthorized(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId, roomCode])

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!roomData || !currentUserId) return

    try {
      const { data: room, error: roomError } = await supabase
        .from('speaking_rooms')
        .select(`
          id,
          participants:speaking_room_participants(
            user_id,
            role,
            joined_at,
            is_online,
            left_at,
            user:user(
              id,
              name,
              gender,
              image
            )
          )
        `)
        .eq('room_code', roomCode)
        .single()

      if (roomError || !room) {
        console.error('Error fetching participants:', {
          error: roomError,
          roomCode,
          userId: currentUserId,
          errorCode: roomError?.code,
          errorMessage: roomError?.message,
          roomData: room
        })
        return
      }

      // Transform participants data
      const transformedParticipants: RoomParticipant[] = room.participants
        .filter((p: any) => p.left_at === null)
        .map((p: any) => ({
          id: (p.user as any)?.id,
          first_name: (p.user as any)?.name?.split(' ')[0] || '',
          last_name: (p.user as any)?.name?.split(' ').slice(1).join(' ') || '',
          avatar_url: (p.user as any)?.image || '',
          gender: (p.user as any)?.gender || 'other',
          role: p.role === 'creator' ? 'original' : 'additional',
          joined_at: p.joined_at,
          is_online: p.is_online
        }))

      setParticipants(transformedParticipants)

    } catch (error) {
      console.error('Error fetching participants:', error)
    }
  }, [roomData, currentUserId, roomCode])

  // Set up realtime subscriptions and presence
  useEffect(() => {
    if (!roomData || !currentUserId) return

    const channelName = `room-${roomCode}`
    
    // Create a single channel for all subscriptions and presence
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    // Track user presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        console.log('Presence updated:', presenceState)
        
        // Update participant online status based on presence
        setParticipants(prev => 
          prev.map(p => ({
            ...p,
            is_online: Object.keys(presenceState).includes(p.id)
          }))
        )
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })

    // Subscribe to room changes
    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'speaking_rooms',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          console.log('Room updated:', payload)
          if (payload.new.status === 'ended') {
            setError('Room has ended.')
            setRoomData(null)
          } else {
            setRoomData(prev => prev ? { ...prev, status: payload.new.status } : null)
          }
        }
      )

    // Subscribe to participant changes
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'speaking_room_participants',
          filter: `room_id=eq.${roomData.id}`
        },
        (payload) => {
          console.log('Participants changed:', payload)
          fetchParticipants()
        }
      )

    // Subscribe to like changes with enhanced filtering
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'speaking_room_likes'
        },
        (payload) => {
          console.log('Likes changed:', payload)
          
          const eventType = payload.eventType
          const newData = payload.new as any
          const oldData = payload.old as any
          
          // Handle INSERT (new like)
          if (eventType === 'INSERT' && newData?.liked_user_id) {
            console.log('New like added:', newData)
            
            // Update like state immediately for better UX
            setParticipantLikes(prev => ({
              ...prev,
              [newData.liked_user_id]: {
                ...prev[newData.liked_user_id],
                hasLiked: newData.liker_id === currentUserId ? true : prev[newData.liked_user_id]?.hasLiked || false,
                likesCount: (prev[newData.liked_user_id]?.likesCount || 0) + 1,
                isLoading: false
              }
            }))
          }
          
          // Handle DELETE (unlike)
          else if (eventType === 'DELETE' && oldData?.liked_user_id) {
            console.log('Like removed:', oldData)
            
            // Update like state immediately for better UX
            setParticipantLikes(prev => ({
              ...prev,
              [oldData.liked_user_id]: {
                ...prev[oldData.liked_user_id],
                hasLiked: oldData.liker_id === currentUserId ? false : prev[oldData.liked_user_id]?.hasLiked || false,
                likesCount: Math.max((prev[oldData.liked_user_id]?.likesCount || 1) - 1, 0),
                isLoading: false
              }
            }))
          }
          
          // Always refresh the affected participant's like data after a small delay
          // This ensures consistency with the database
          const affectedUserId = newData?.liked_user_id || oldData?.liked_user_id
          if (affectedUserId) {
            setTimeout(() => {
              fetchParticipantLikes(affectedUserId)
            }, 500)
          }
        }
      )

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to room channel')
        
        // Track user presence
        const presenceData = {
          user_id: currentUserId,
          online_at: new Date().toISOString(),
          room_code: roomCode
        }
        
        await channel.track(presenceData)
        console.log('Started tracking presence for user:', currentUserId)
      }
    })

    return () => {
      console.log('Cleaning up channel subscriptions and presence')
      channel.untrack()
      channel.unsubscribe()
    }
  }, [roomData, currentUserId, roomCode, fetchParticipants])

  // Fetch like status for a specific participant with enhanced error handling
  const fetchParticipantLikes = useCallback(async (participantId: string) => {
    if (!currentUserId || !participantId || currentUserId === participantId) return

    try {
      // Use Promise.all to fetch both the user's like status and total likes count in parallel
      const [userLikeResult, totalLikesResult] = await Promise.all([
        // Check if current user has liked this participant
        supabase
          .from('speaking_room_likes')
          .select('id')
          .eq('liker_id', currentUserId)
          .eq('liked_user_id', participantId)
          .maybeSingle(), // Use maybeSingle() instead of single() to avoid errors when no rows found

        // Get total likes for this participant
        supabase
          .from('speaking_room_likes')
          .select('*', { count: 'exact' })
          .eq('liked_user_id', participantId)
      ])

      const { data: existingLike, error: likeError } = userLikeResult
      const { count: totalLikes, error: countError } = totalLikesResult

      if (likeError) {
        console.error('Error fetching user like status:', likeError)
        return
      }

      if (countError) {
        console.error('Error fetching total likes count:', countError)
        return
      }

      setParticipantLikes(prev => ({
        ...prev,
        [participantId]: {
          hasLiked: !!existingLike,
          likesCount: totalLikes || 0,
          isLoading: false
        }
      }))

      console.log(`Fetched likes for ${participantId}: hasLiked=${!!existingLike}, count=${totalLikes}`)

    } catch (error) {
      console.error(`Error fetching likes for participant ${participantId}:`, error)
      
      // Set safe defaults on error
      setParticipantLikes(prev => ({
        ...prev,
        [participantId]: {
          hasLiked: prev[participantId]?.hasLiked || false,
          likesCount: prev[participantId]?.likesCount || 0,
          isLoading: false
        }
      }))
    }
  }, [currentUserId])

  // Fetch likes for all participants
  const fetchAllParticipantsLikes = useCallback(async () => {
    if (!currentUserId || participants.length === 0) return

    const otherParticipants = participants.filter(p => p.id !== currentUserId)
    
    for (const participant of otherParticipants) {
      await fetchParticipantLikes(participant.id)
    }
  }, [currentUserId, participants, fetchParticipantLikes])

  // Like/unlike a participant with optimistic updates
  const toggleParticipantLike = useCallback(async (participantId: string) => {
    if (!currentUserId || !roomData || currentUserId === participantId) return

    const currentLikeState = participantLikes[participantId]?.hasLiked || false
    const currentLikesCount = participantLikes[participantId]?.likesCount || 0
    
    // Optimistic UI update - immediately show the expected state
    setParticipantLikes(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        hasLiked: !currentLikeState, // Toggle the state
        likesCount: !currentLikeState 
          ? currentLikesCount + 1  // Adding a like
          : Math.max(currentLikesCount - 1, 0), // Removing a like
        isLoading: true
      }
    }))

    try {
      if (currentLikeState) {
        // Unlike - remove the like
        const { error } = await supabase
          .from('speaking_room_likes')
          .delete()
          .eq('liker_id', currentUserId)
          .eq('liked_user_id', participantId)

        if (error) throw error
      } else {
        // Like - add the like (ensure we have room_id)
        const { error } = await supabase
          .from('speaking_room_likes')
          .insert({
            room_id: roomData.id,
            liker_id: currentUserId,
            liked_user_id: participantId
          })

        if (error) throw error
      }

      console.log('Like operation completed successfully')

    } catch (error) {
      console.error('Error toggling participant like:', error)
      setError('Failed to update like. Please try again.')
      
      // Revert optimistic update on error
      setParticipantLikes(prev => ({
        ...prev,
        [participantId]: {
          ...prev[participantId],
          hasLiked: currentLikeState, // Revert to original state
          likesCount: currentLikesCount, // Revert to original count
          isLoading: false
        }
      }))
      
      // Refresh from database to ensure consistency
      setTimeout(() => {
        fetchParticipantLikes(participantId)
      }, 1000)
    }
  }, [currentUserId, roomData, participantLikes, fetchParticipantLikes])

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!currentUserId || !roomData) return

    try {
      const { error } = await supabase
        .from('speaking_room_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', roomData.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error leaving room:', error)
      setError('Failed to leave room. Please try again.')
      return false
    }
  }, [currentUserId, roomData])

  // Initialize data - only when session is available
  useEffect(() => {
    console.log('useSpeakingRoom: Initialize effect triggered:', { 
      hasSession: !!session, 
      hasUserId: !!currentUserId, 
      roomCode 
    })
    
    if (currentUserId && roomCode) {
      fetchRoomData()
    } else if (!currentUserId && roomCode) {
      console.log('useSpeakingRoom: Waiting for user session...')
      setIsLoading(true)
    }
  }, [currentUserId, roomCode, fetchRoomData])

  useEffect(() => {
    if (roomData && isAuthorized) {
      fetchParticipants()
    }
  }, [roomData, isAuthorized, fetchParticipants])

  useEffect(() => {
    if (participants.length > 0) {
      fetchAllParticipantsLikes()
    }
  }, [participants, fetchAllParticipantsLikes])

  return {
    roomData,
    participants,
    participantLikes,
    isLoading,
    error,
    isAuthorized,
    toggleParticipantLike,
    leaveRoom,
    fetchRoomData,
    fetchParticipants
  }
}