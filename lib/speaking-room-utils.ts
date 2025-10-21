import { supabase } from '@/lib/supabase'

export interface AgoraTokenResponse {
  token: string
  appId: string
}

// Generate Agora token (still use API endpoint since it requires server-side calculation)
export async function getAgoraToken(
  channelName: string,
  uid: string
): Promise<AgoraTokenResponse | null> {
  try {
    const response = await fetch('/api/agora-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName,
        uid
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get Agora token')
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting Agora token:', error)
    return null
  }
}

// Update room status
export async function updateRoomStatus(
  roomCode: string,
  status: 'active' | 'ended'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('speaking_rooms')
      .update({ status })
      .eq('room_code', roomCode)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating room status:', error)
    return false
  }
}

// Update participant online status
export async function updateParticipantOnlineStatus(
  roomCode: string,
  userId: string,
  isOnline: boolean
): Promise<boolean> {
  try {
    // First get the room id
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select('id')
      .eq('room_code', roomCode)
      .single()

    if (roomError) {
      console.warn('Room lookup error:', roomError.message, 'for room:', roomCode)
      // If room doesn't exist, it might have been cleaned up - this is not necessarily an error
      if (roomError.code === 'PGRST116') {
        console.log('Room not found - may have been ended or cleaned up')
        return true // Return true as the room no longer exists
      }
      return false
    }

    if (!room) {
      console.warn('Room not found for code:', roomCode)
      return true // Room may have been cleaned up
    }

    // Update participant online status
    const { error } = await supabase
      .from('speaking_room_participants')
      .update({ is_online: isOnline })
      .eq('room_id', room.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating participant status:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error updating participant online status:', error)
    return false
  }
}

// Add new participant to room
export async function addParticipantToRoom(
  roomCode: string,
  userId: string,
  role: 'creator' | 'participant' = 'participant'
): Promise<boolean> {
  try {
    // Get the room
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select('id')
      .eq('room_code', roomCode)
      .eq('status', 'active')
      .single()

    if (roomError || !room) throw new Error('Room not found or not active')

    // Add participant
    const { error } = await supabase
      .from('speaking_room_participants')
      .insert({
        room_id: room.id,
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
        is_online: true
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error adding participant to room:', error)
    return false
  }
}

// Remove participant from room (set left_at timestamp)
export async function removeParticipantFromRoom(
  roomCode: string,
  userId: string
): Promise<boolean> {
  try {
    // Get the room
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select('id')
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) throw new Error('Room not found')

    // Update participant with left timestamp
    const { error } = await supabase
      .from('speaking_room_participants')
      .update({ 
        left_at: new Date().toISOString(),
        is_online: false
      })
      .eq('room_id', room.id)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error removing participant from room:', error)
    return false
  }
}

// Check if user has active room
export async function getUserActiveRoom(userId: string): Promise<{
  room_code: string
  status: string
} | null> {
  try {
    // First check if user is the creator of any active room
    const { data: room, error } = await supabase
      .from('speaking_rooms')
      .select('room_code, status')
      .eq('status', 'active')
      .eq('creator_id', userId)
      .single()

    if (!error && room) {
      return room
    }

    // If not creator, check if user is an active participant in any room
    const { data: participantRoom, error: participantError } = await supabase
      .from('speaking_room_participants')
      .select(`
        room:speaking_rooms!inner(
          room_code,
          status
        )
      `)
      .eq('user_id', userId)
      .is('left_at', null)
      .eq('room.status', 'active')
      .single()

    if (participantError || !participantRoom) return null

    return {
      room_code: (participantRoom.room as any).room_code,
      status: (participantRoom.room as any).status
    }
  } catch (error) {
    console.error('Error checking user active room:', error)
    return null
  }
}

// Get room statistics for analytics
export async function getRoomStats(roomCode: string): Promise<{
  totalParticipants: number
  activeDuration: number
  totalLikes: number
} | null> {
  try {
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select(`
        id,
        created_at,
        participants:speaking_room_participants(count),
        likes:speaking_room_likes(count)
      `)
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) return null

    const createdAt = new Date(room.created_at)
    const now = new Date()
    const activeDuration = Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60) // in minutes

    return {
      totalParticipants: (room.participants as any)[0]?.count || 0,
      activeDuration,
      totalLikes: (room.likes as any)[0]?.count || 0
    }
  } catch (error) {
    console.error('Error getting room stats:', error)
    return null
  }
}

// Save room session data for analytics
export async function saveRoomSession(
  roomCode: string,
  userId: string,
  sessionData: {
    duration: number
    joinedAt: string
    leftAt: string
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('speaking_room_sessions')
      .insert({
        room_code: roomCode,
        user_id: userId,
        duration: sessionData.duration,
        joined_at: sessionData.joinedAt,
        left_at: sessionData.leftAt
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving room session:', error)
    return false
  }
}

// End room for all participants and update their presence status using Supabase realtime
export async function endRoomForAllParticipants(
  roomCode: string,
  userId: string,
  sessionDuration?: number
): Promise<boolean> {
  try {
    // Get the room data first
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select(`
        id,
        creator_id,
        participants:speaking_room_participants(
          user_id,
          left_at
        )
      `)
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) {
      throw new Error('Room not found')
    }

    // Check if user is authorized (creator or participant)
    const isCreator = room.creator_id === userId
    const isParticipant = room.participants.some((p: any) => p.user_id === userId && p.left_at === null)

    if (!isCreator && !isParticipant) {
      throw new Error('Not authorized to end this room')
    }

    // Start a transaction-like operation
    // 1. End the room
    const { error: roomUpdateError } = await supabase
      .from('speaking_rooms')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: sessionDuration || 0
      })
      .eq('room_code', roomCode)

    if (roomUpdateError) throw roomUpdateError

    // 2. Mark all participants as left
    const { error: participantsUpdateError } = await supabase
      .from('speaking_room_participants')
      .update({
        left_at: new Date().toISOString(),
        is_online: false
      })
      .eq('room_id', room.id)
      .is('left_at', null)

    if (participantsUpdateError) throw participantsUpdateError

    // 3. Update user presences - clear room info
    const activeParticipantIds = room.participants
      .filter((p: any) => p.left_at === null)
      .map((p: any) => p.user_id)

    if (activeParticipantIds.length > 0) {
      const { error: presenceUpdateError } = await supabase
        .from('user_presence')
        .update({
          updatedAt: new Date().toISOString(),
          in_room: false,
          room_code: null,
          room_created_at: null
        })
        .in('userId', activeParticipantIds)

      if (presenceUpdateError) throw presenceUpdateError
    }

    // 4. Broadcast room ended event via realtime
    const channel = supabase.channel(`room:${roomCode}`)
    await channel.send({
      type: 'broadcast',
      event: 'room_ended',
      payload: {
        roomCode,
        endedBy: userId,
        endedAt: new Date().toISOString(),
        duration: sessionDuration || 0
      }
    })

    return true
  } catch (error) {
    console.error('Error ending room for all participants:', error)
    return false
  }
}

// Subscribe to room events using Supabase realtime
export function subscribeToRoomUpdates(
  roomCode: string,
  callbacks: {
    onRoomEnded?: (payload: any) => void
    onParticipantJoined?: (payload: any) => void
    onParticipantLeft?: (payload: any) => void
    onPresenceUpdate?: (payload: any) => void
  }
) {
  const channel = supabase.channel(`room:${roomCode}`)

  // Subscribe to room status changes
  channel
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'speaking_rooms',
      filter: `room_code=eq.${roomCode}`
    }, (payload) => {
      if (payload.new.status === 'ended' && callbacks.onRoomEnded) {
        callbacks.onRoomEnded(payload.new)
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'speaking_room_participants'
    }, (payload) => {
      // Handle participant changes
      if (payload.eventType === 'INSERT' && callbacks.onParticipantJoined) {
        callbacks.onParticipantJoined(payload.new)
      } else if (payload.eventType === 'UPDATE' && payload.new.left_at && callbacks.onParticipantLeft) {
        callbacks.onParticipantLeft(payload.new)
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_presence'
    }, (payload) => {
      if (callbacks.onPresenceUpdate) {
        callbacks.onPresenceUpdate(payload.new)
      }
    })
    .on('broadcast', { event: 'room_ended' }, (payload) => {
      if (callbacks.onRoomEnded) {
        callbacks.onRoomEnded(payload.payload)
      }
    })

  channel.subscribe((status) => {
    console.log('Room subscription status:', status)
  })

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}

// Get room data using direct Supabase query instead of API
export async function getRoomData(
  roomCode: string,
  userId: string
): Promise<{
  room: any
  error?: string
} | null> {
  try {
    // First get the room basic data
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select('id, room_code, creator_id, status, created_at, agora_channel_name')
      .eq('room_code', roomCode)
      .eq('status', 'active')
      .single()

    if (roomError || !room) {
      return { room: null, error: 'Room not found or has ended' }
    }

    // Get creator data
    const { data: creator, error: creatorError } = await supabase
      .from('User')
      .select('id, name, gender, image')
      .eq('id', room.creator_id)
      .single()

    if (creatorError) {
      console.error('Error fetching creator data:', creatorError)
    }

    // Get participants data with user info
    const { data: participants, error: participantsError } = await supabase
      .from('speaking_room_participants')
      .select(`
        user_id,
        role,
        joined_at,
        left_at,
        is_online
      `)
      .eq('room_id', room.id)
      .is('left_at', null)

    // Get user details for participants
    let participantsWithUserData: any[] = []
    if (participants && participants.length > 0) {
      const userIds = participants.map(p => p.user_id)
      const { data: users, error: usersError } = await supabase
        .from('User')
        .select('id, name, gender, image')
        .in('id', userIds)

      if (!usersError && users) {
        participantsWithUserData = participants.map(p => ({
          ...p,
          user: users.find(u => u.id === p.user_id)
        }))
      }
    }

    if (participantsError) {
      console.error('Error fetching participants data:', participantsError)
    }

    // Check if user is authorized to access this room
    const isCreator = room.creator_id === userId
    const isParticipant = participantsWithUserData?.some((p: any) => p.user_id === userId) || false

    if (!isCreator && !isParticipant) {
      return { room: null, error: 'You are not authorized to access this room' }
    }

    // Format room data for client (matching API format)
    const activeParticipants = participantsWithUserData || []
    const otherParticipant = activeParticipants.find((p: any) => p.user_id !== room.creator_id)

    const roomData = {
      id: room.id,
      room_code: room.room_code,
      user1_id: room.creator_id,
      user2_id: otherParticipant?.user_id || null,
      status: room.status,
      created_at: room.created_at,
      agora_channel_name: room.agora_channel_name,
      user1: creator ? {
        id: creator.id,
        first_name: creator.name?.split(' ')[0] || '',
        last_name: creator.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: creator.image || '',
        gender: creator.gender || 'other'
      } : null,
      user2: otherParticipant?.user ? {
        id: otherParticipant.user.id,
        first_name: otherParticipant.user.name?.split(' ')[0] || '',
        last_name: otherParticipant.user.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: otherParticipant.user.image || '',
        gender: otherParticipant.user.gender || 'other'
      } : null,
      participants: activeParticipants.map((p: any) => ({
        id: p.user?.id || p.user_id,
        first_name: p.user?.name?.split(' ')[0] || '',
        last_name: p.user?.name?.split(' ').slice(1).join(' ') || '',
        avatar_url: p.user?.image || '',
        gender: p.user?.gender || 'other',
        role: p.user_id === room.creator_id ? 'original' : 'additional',
        joined_at: p.joined_at,
        is_online: p.is_online
      }))
    }

    return { room: roomData }
  } catch (error) {
    console.error('Error getting room data:', error)
    return { room: null, error: 'Error fetching room data' }
  }
}

// Create a new room using direct Supabase operations instead of API
export async function createRoomWithRealtime(
  userId: string,
  receiverId?: string,
  roomType: string = 'instant',
  maxParticipants: number = 10
): Promise<{
  room?: any
  error?: string
}> {
  try {
    // Generate unique room code
    let roomCode: string
    let attempts = 0
    do {
      roomCode = Math.random().toString(36).substr(2, 8).toUpperCase()
      attempts++
      if (attempts > 10) {
        throw new Error('Failed to generate unique room code')
      }
      
      const { data: existingRoom } = await supabase
        .from('speaking_rooms')
        .select('room_code')
        .eq('room_code', roomCode)
        .single()
        
      if (!existingRoom) break
    } while (true)

    // Create the room
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .insert({
        room_code: roomCode,
        creator_id: userId,
        status: 'active',
        room_type: roomType,
        max_participants: maxParticipants,
        agora_channel_name: roomCode,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Add creator as participant
    const { error: participantError } = await supabase
      .from('speaking_room_participants')
      .insert({
        room_id: room.id,
        user_id: userId,
        role: 'creator',
        is_online: true,
        joined_at: new Date().toISOString()
      })

    if (participantError) throw participantError

    // If receiverId is provided, add them as a participant
    if (receiverId) {
      const { error: receiverParticipantError } = await supabase
        .from('speaking_room_participants')
        .insert({
          room_id: room.id,
          user_id: receiverId,
          role: 'participant',
          is_online: false,
          joined_at: new Date().toISOString()
        })

      if (receiverParticipantError) throw receiverParticipantError
    }

    // Update creator presence
    const { error: presenceError } = await supabase
      .from('user_presence')
      .upsert({
        userId: userId,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        in_room: true,
        room_code: roomCode,
        room_created_at: new Date().toISOString()
      })

    if (presenceError) throw presenceError

    // If receiverId is provided, update their presence too
    if (receiverId) {
      const { error: receiverPresenceError } = await supabase
        .from('user_presence')
        .upsert({
          userId: receiverId,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          in_room: true,
          room_code: roomCode,
          room_created_at: new Date().toISOString()
        })

      if (receiverPresenceError) throw receiverPresenceError
    }

    // Broadcast room created event via realtime
    const channel = supabase.channel(`room:${roomCode}`)
    await channel.send({
      type: 'broadcast',
      event: 'room_created',
      payload: {
        roomCode,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        receiverId
      }
    })

    return {
      room: {
        id: room.id,
        room_code: room.room_code,
        creator_id: room.creator_id,
        status: room.status,
        created_at: room.created_at,
        agora_channel_name: room.agora_channel_name
      }
    }
  } catch (error) {
    console.error('Error creating room with realtime:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to create room'
    }
  }
}

// Join a room using direct Supabase operations with realtime updates
export async function joinRoomWithRealtime(
  roomCode: string,
  userId: string
): Promise<{
  success: boolean
  error?: string
  roomData?: any
}> {
  try {
    // Check if user can join the room
    const joinCheck = await canUserJoinRoom(roomCode, userId)
    if (!joinCheck.canJoin) {
      return { success: false, error: joinCheck.reason }
    }

    // Update participant as online
    const { error: participantUpdateError } = await supabase
      .from('speaking_room_participants')
      .update({
        is_online: true,
        joined_at: new Date().toISOString()
      })
      .eq('room_id', joinCheck.roomData.id)
      .eq('user_id', userId)

    if (participantUpdateError) throw participantUpdateError

    // Update user presence
    const { error: presenceError } = await supabase
      .from('user_presence')
      .upsert({
        userId: userId,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        in_room: true,
        room_code: roomCode,
        room_created_at: new Date().toISOString()
      })

    if (presenceError) throw presenceError

    // Get updated room data
    const roomDataResult = await getRoomData(roomCode, userId)
    if (!roomDataResult?.room) {
      return { success: false, error: 'Failed to get room data after joining' }
    }

    // Broadcast user joined event via realtime
    const channel = supabase.channel(`room:${roomCode}`)
    await channel.send({
      type: 'broadcast',
      event: 'user_joined',
      payload: {
        roomCode,
        userId,
        joinedAt: new Date().toISOString()
      }
    })

    return { 
      success: true, 
      roomData: roomDataResult.room 
    }
  } catch (error) {
    console.error('Error joining room with realtime:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to join room' 
    }
  }
}

// Leave a room using direct Supabase operations with realtime updates
export async function leaveRoomWithRealtime(
  roomCode: string,
  userId: string,
  sessionDuration?: number
): Promise<boolean> {
  try {
    // Remove participant from room (set left_at timestamp)
    const success = await removeParticipantFromRoom(roomCode, userId)
    if (!success) return false

    // Update user presence
    const { error: presenceError } = await supabase
      .from('user_presence')
      .update({
        updatedAt: new Date().toISOString(),
        in_room: false,
        room_code: null,
        room_created_at: null
      })
      .eq('userId', userId)

    if (presenceError) {
      console.error('Error updating presence:', presenceError)
    }

    // Save session data if duration provided
    if (sessionDuration) {
      await saveRoomSession(roomCode, userId, {
        duration: sessionDuration,
        joinedAt: new Date(Date.now() - sessionDuration * 1000).toISOString(),
        leftAt: new Date().toISOString()
      })
    }

    // Broadcast user left event via realtime
    const channel = supabase.channel(`room:${roomCode}`)
    await channel.send({
      type: 'broadcast',
      event: 'user_left',
      payload: {
        roomCode,
        userId,
        leftAt: new Date().toISOString(),
        sessionDuration
      }
    })

    return true
  } catch (error) {
    console.error('Error leaving room with realtime:', error)
    return false
  }
}

// Check if user can join room (not at capacity, authorized, etc.)
export async function canUserJoinRoom(
  roomCode: string,
  userId: string
): Promise<{
  canJoin: boolean
  reason?: string
  roomData?: any
}> {
  try {
    // Get room data
    const { data: room, error: roomError } = await supabase
      .from('speaking_rooms')
      .select(`
        id,
        room_code,
        status,
        creator_id,
        participants:speaking_room_participants(
          user_id,
          left_at
        )
      `)
      .eq('room_code', roomCode)
      .single()

    if (roomError || !room) {
      return { canJoin: false, reason: 'Room not found' }
    }

    if (room.status !== 'active') {
      return { canJoin: false, reason: 'Room is not active', roomData: room }
    }

    // Check if user is the creator or one of the original participants
    const isCreator = room.creator_id === userId
    const isOriginalParticipant = room.participants.some((p: any) => p.user_id === userId)

    if (!isCreator && !isOriginalParticipant) {
      return { canJoin: false, reason: 'Not authorized to join this room' }
    }

    return { 
      canJoin: true, 
      roomData: room 
    }
  } catch (error) {
    console.error('Error checking if user can join room:', error)
    return { canJoin: false, reason: 'Error checking room access' }
  }
}